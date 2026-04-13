import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser (để đọc cookie httpOnly từ request)
  app.use(cookieParser());


  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // xóa properties không có trong DTO
      forbidNonWhitelisted: true, // báo lỗi nếu gửi field lạ
      transform: true,            // tự động transform types
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 8000;

  await app.listen(port);
  console.log(`[API Gateway] Running on: http://localhost:${port}`);
}
bootstrap();
