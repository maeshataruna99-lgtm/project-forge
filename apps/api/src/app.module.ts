import { Module } from '@nestjs/common';
import { GeneratorController } from './generator.controller';

@Module({ controllers: [GeneratorController] })
export class AppModule {}
