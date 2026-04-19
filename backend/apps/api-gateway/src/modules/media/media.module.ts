import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'MEDIA_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url: config.get<string>('MEDIA_SERVICE_GRPC_URL') || 'localhost:50054',
            package: 'media',
            protoPath: join(process.cwd(), 'libs/shared/proto/media.proto'),
            loader: { keepCase: true },
            maxSendMessageLength: 16 * 1024 * 1024,
            maxReceiveMessageLength: 16 * 1024 * 1024,
          },
        }),
      },
    ]),
  ],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
