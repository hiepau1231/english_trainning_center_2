import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cấu hình CORS nếu cần
  app.enableCors();

  // Cấu hình validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Cấu hình limit cho file upload
  app.use(json({ limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
