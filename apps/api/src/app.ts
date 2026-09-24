import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { ConfigSgt } from './config';

export async function crearApp(config: ConfigSgt, opciones: { logs?: boolean } = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.registrar(config), { logger: opciones.logs === false ? false : undefined });
  app.setGlobalPrefix('api');
  // La app de escritorio consume la API desde otro origen (Electron / Vite en desarrollo).
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  return app;
}
