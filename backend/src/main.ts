import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { UPLOADS_FOLDER } from './listings/upload-options.js';


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(process.cwd(), UPLOADS_FOLDER), {
    prefix: `/${UPLOADS_FOLDER}/`,
    setHeaders: (response) => response.setHeader('X-Content-Type-Options', 'nosniff'),
  });
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  
  app.enableCors({ origin: 'http://localhost:5173', credentials: true,
   });

  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
