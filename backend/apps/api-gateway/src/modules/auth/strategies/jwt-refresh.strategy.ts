import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest } from 'passport-jwt';
import { Request } from 'express';
import { decode as jwtDecode } from 'jsonwebtoken';
import { GatewayJwtKeyService } from '../gateway-jwt-key.service';

// Strategy xác thực JWT Refresh Token. Refresh key được lookup bằng kid y như access.
@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly keyService: GatewayJwtKeyService) {
    const options: StrategyOptionsWithRequest = {
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.['refresh_token'] ?? null;
      },
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
            return done(new UnauthorizedException('Refresh token thiếu kid header'));
          }
          keyService
            .getSecret(kid)
            .then((secret) => done(null, secret))
            .catch((err) => done(err as Error));
        } catch (err) {
          done(err as Error);
        }
      },
      passReqToCallback: true,
    };
    super(options);
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req?.cookies?.['refresh_token'];

    return {
      id:    payload.sub,
      email: payload.email,
      role:  payload.role,
      refreshToken,
    };
  }
}
