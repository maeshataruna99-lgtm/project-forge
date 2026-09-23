import 'dotenv/config';
import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { HealthController } from './health.controller';
/*__AUTH_IMPORT__*/
/*__FEATURE_IMPORTS__*/
/*__BLUEPRINT_IMPORT__*/

@Module({ imports: [/*__AUTH_MODULE__*//*__FEATURE_MODULES__*//*__BLUEPRINT_MODULE__*/], controllers: [HealthController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
