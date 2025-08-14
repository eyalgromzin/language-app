import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = parseInt(process.env.PORT ?? '3000', 10);
  // Bind to all interfaces so emulators/devices can reach the server
  await app.listen(port, '0.0.0.0');
  const url = await app.getUrl();
  // eslint-disable-next-line no-console
  console.log(`Server is running at: ${url}`);
}
bootstrap();
