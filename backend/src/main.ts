import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ALLOWED_ORIGINS } from './common/cors-origins';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // helmet's defaults (nosniff, no X-Powered-By, no-referrer-when-downgrade,
  // etc.) — nginx sits in front in production and can add its own headers,
  // but the app shouldn't rely on that alone. CSP is left to nginx (it needs
  // to differ per site — admin dashboard vs. the marketing sites — and
  // nginx already serves all of them).
  app.use(helmet({ contentSecurityPolicy: false }));

  // Mobile apps aren't subject to CORS (it's a browser-only mechanism), so
  // this only actually restricts which *websites* can call the API from JS
  // — the admin dashboard and the two marketing sites (the waitlist form
  // posts to the API from tryride.ng). A bare enableCors() reflected any
  // origin, including one hosting malicious JS.
  app.enableCors({ origin: ALLOWED_ORIGINS });

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
