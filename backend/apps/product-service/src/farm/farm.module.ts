import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Farm } from '../entities/farm.entity';
import { Batch } from '../entities/batch.entity';
import { FarmService } from './farm.service';
import { FarmController } from './farm.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Farm, Batch]),
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.GRPC,
          options: {
            url:
              config.get<string>('USER_SERVICE_GRPC_URL') || 'localhost:50051',
            package: 'user',
            protoPath: join(process.cwd(), 'libs/shared/proto/user.proto'),
            loader: { keepCase: true },
          },
        }),
      },
    ]),
  ],
  controllers: [FarmController],
  providers: [FarmService],
})
export class FarmModule {}
