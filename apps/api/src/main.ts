import 'reflect-metadata';
import { crearApp } from './app';
import { configDesdeEntorno } from './config';

async function bootstrap() {
  const app = await crearApp(configDesdeEntorno());
  const puerto = Number(process.env.PORT ?? 3000);
  await app.listen(puerto);
  console.log(`API SGT escuchando en http://localhost:${puerto}/api`);
}

void bootstrap();
