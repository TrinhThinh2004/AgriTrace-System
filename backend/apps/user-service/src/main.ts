import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // ── Tạo hybrid app: HTTP (health check) + gRPC (business) ──
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const grpcUrl = configService.get<string>('GRPC_URL') || '0.0.0.0:50051';

  // ── Connect gRPC microservice ──
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: grpcUrl,
      package: 'user',
      protoPath: join(process.cwd(), 'libs/shared/proto/user.proto'),
    },
  });

  await app.startAllMicroservices();

  // HTTP port (health check endpoint)
  const httpPort = configService.get<number>('USER_SERVICE_PORT') ?? 3001;
  await app.listen(httpPort);

  console.log(`[User Service] gRPC  → ${grpcUrl}`);
  console.log(`[User Service] HTTP  → http://localhost:${httpPort}`);
}

bootstrap();
