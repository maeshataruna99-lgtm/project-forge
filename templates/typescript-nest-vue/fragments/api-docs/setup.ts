import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { INestApplication } from '@nestjs/common';

export function configureApiDocs(app: INestApplication) {
  const options = new DocumentBuilder().setTitle('Project Forge API').setDescription('Generated starter API documentation').setVersion('0.1.0').build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, options));
}
