import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { decode as jwtDecode } from 'jsonwebtoken';
import { GatewayJwtKeyService } from '../gateway-jwt-key.service';
import { TokenRevocationClient } from '../token-revocation.client';

export interface JwtPayload {
  sub: string;    // user id
  email: string;
  role: string;
  jti?: string;
  exp?: number;
}

// Strategy xác thực JWT Access Token. Dùng secretOrKeyProvider để tra kid trong key ring.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly keyService: GatewayJwtKeyService,
    private readonly revocationClient: TokenRevocationClient,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (
        _request: unknown,
        rawJwtToken: string,
        done: (err: Error | null, secret?: string) => void,
      ) => {
        try {
          const decoded = jwtDecode(rawJwtToken, { complete: true }) as
            | { header?: { kid?: string } }
            | null;
          const kid = decoded?.header?.kid;
          if (!kid) {
            return done(new UnauthorizedException('Token thiếu kid header'));
          }
          keyService
            .getSecret(kid)
            .then((secret) => done(null, secret))
            .catch((err) => done(err as Error));
        } catch (err) {
          done(err as Error);
        }
      },
    });
  }

  async validate(payload: JwtPayload) {
    // Check blacklist
    if (payload.jti && (await this.revocationClient.isRevoked(payload.jti))) {
      throw new UnauthorizedException('Token đã bị thu hồi');
    }

    return {
      id:    payload.sub,
      email: payload.email,
      role:  payload.role,
      jti:   payload.jti,
      exp:   payload.exp,
    };
  }
}
