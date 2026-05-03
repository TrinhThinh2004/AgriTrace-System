import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';
import { GrpcExceptionFilter } from './common/grpc-exception.filter';

async function bootstrap() {
  // ── Hybrid app: HTTP (health check) + gRPC (business) ──
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const grpcUrl = configService.get<string>('AUDIT_SERVICE_GRPC_URL') || '0.0.0.0:50055';

  // ── Connect gRPC microservice ──
  const microservice = app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: grpcUrl,
      package: 'audit',
      protoPath: join(process.cwd(), 'libs/shared/proto/audit.proto'),
      loader: { keepCase: true },
    },
  });

  microservice.useGlobalFilters(new GrpcExceptionFilter());

  await app.startAllMicroservices();

  const httpPort = configService.get<number>('AUDIT_SERVICE_PORT') ?? 3005;
  await app.listen(httpPort);

  console.log(`[Audit Service] gRPC  → ${grpcUrl}`);
  console.log(`[Audit Service] HTTP  → http://localhost:${httpPort}`);
}

bootstrap();
