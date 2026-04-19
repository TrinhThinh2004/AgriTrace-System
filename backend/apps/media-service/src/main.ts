import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const grpcUrl = configService.get<string>('MEDIA_GRPC_URL') || '0.0.0.0:50054';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: grpcUrl,
      package: 'media',
      protoPath: join(process.cwd(), 'libs/shared/proto/media.proto'),
      loader: { keepCase: true },
      // Cloudinary upload có thể trả buffer lớn — nới giới hạn message gRPC.
      maxSendMessageLength: 16 * 1024 * 1024,
      maxReceiveMessageLength: 16 * 1024 * 1024,
    },
  });

  await app.startAllMicroservices();

  const httpPort = configService.get<number>('MEDIA_SERVICE_PORT') ?? 3004;
  await app.listen(httpPort);

  console.log(`[Media Service] gRPC  → ${grpcUrl}`);
  console.log(`[Media Service] HTTP  → http://localhost:${httpPort}`);
}

bootstrap();
