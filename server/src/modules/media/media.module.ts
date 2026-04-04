import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaFile } from './entities/media-file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaFile])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class MediaModule {}
