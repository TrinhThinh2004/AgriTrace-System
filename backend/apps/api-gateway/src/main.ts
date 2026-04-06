import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // xóa properties không có trong DTO
      forbidNonWhitelisted: true, // báo lỗi nếu gửi field lạ
      transform: true,            // tự động transform types
    }),
  );

  // CORS
  app.enableCors();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 8000;

  await app.listen(port);
  console.log(`[API Gateway] Running on: http://localhost:${port}`);
}
bootstrap();
