import 'dotenv/config';
import 'reflect-metadata';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HealthController } from './health.controller';
/*__AUTH_IMPORT__*/
/*__FEATURE_IMPORTS__*/
/*__MASTER_IMPORT__*/
/*__BLUEPRINT_IMPORT__*/
/*__INTEGRATION_IMPORTS__*/

@Module({ imports: [/*__APP_MODULES__*/], controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  /*__API_DOCS_BOOTSTRAP__*/
  /*__LOGGER_BOOTSTRAP__*/
  /*__RATE_LIMIT_BOOTSTRAP__*/
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
