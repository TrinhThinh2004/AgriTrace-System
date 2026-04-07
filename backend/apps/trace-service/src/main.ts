import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  // ── Hybrid app: HTTP (health check) + gRPC (business) ──
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const grpcUrl = configService.get<string>('TRACE_SERVICE_GRPC_URL') || '0.0.0.0:50053';

  // ── Connect gRPC microservice ──
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: grpcUrl,
      package: 'trace',
      protoPath: join(process.cwd(), 'libs/shared/proto/trace.proto'),
      loader: { keepCase: true },
    },
  });

  await app.startAllMicroservices();

  // HTTP port (health check endpoint)
  const httpPort = configService.get<number>('TRACE_SERVICE_PORT') ?? 3003;
  await app.listen(httpPort);

  console.log(`[Trace Service] gRPC  → ${grpcUrl}`);
  console.log(`[Trace Service] HTTP  → http://localhost:${httpPort}`);
}

bootstrap();
