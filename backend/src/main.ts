import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // rider/driver apps and admin dashboard all call this API from different origins.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip any properties not declared on the DTO
      forbidNonWhitelisted: true, // reject requests that include unexpected fields
      transform: true, // coerce primitives (e.g. query string numbers) to their DTO types
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
