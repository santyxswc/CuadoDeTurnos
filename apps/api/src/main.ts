import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // La app de escritorio consume la API desde otro origen (Electron / Vite en desarrollo).
  app.enableCors();
  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);
  console.log(`API SGT escuchando en http://localhost:${puerto}/api`);
}

void bootstrap();
