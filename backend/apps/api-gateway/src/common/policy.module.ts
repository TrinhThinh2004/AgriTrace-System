import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { OwnershipGuard } from './guards/ownership.guard';

/**
 * PolicyModule — đăng ký gRPC client PRODUCT_SERVICE phục vụ ABAC checks.
 * Global để OwnershipGuard có thể inject ở bất cứ đâu.
 */
@Global()
@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'PRODUCT_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url:
              config.get<string>('PRODUCT_SERVICE_GRPC_URL') ||
              'localhost:50052',
            package: 'product',
            protoPath: join(process.cwd(), 'libs/shared/proto/product.proto'),
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  providers: [OwnershipGuard],
  exports: [OwnershipGuard, ClientsModule],
})
export class PolicyModule {}
