import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json, type NextFunction, type Request, type Response } from 'express';
import { AppModule } from './app.module';

type CorrelatedRequest = Request & { correlationId?: string };

@Catch()
class SafeExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<CorrelatedRequest>();
    const response = context.getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const detail = error instanceof HttpException ? error.getResponse() : {};
    const payload = typeof detail === 'object' && detail !== null ? detail : {};
    response.status(status).json({ code: 'GENERATION_FAILED', ...payload, correlationId: request.correlationId });
  }
}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  app.use((request: CorrelatedRequest, response: Response, next: NextFunction) => {
    request.correlationId = randomUUID();
    response.setHeader('X-Correlation-ID', request.correlationId);
    next();
  });
  app.use(json({ limit: '16kb', strict: true }));
  app.use((error: { type?: string }, request: CorrelatedRequest, response: Response, _next: NextFunction) => {
    const tooLarge = error.type === 'entity.too.large';
    response.status(tooLarge ? 413 : 400).json({
      code: tooLarge ? 'REQUEST_TOO_LARGE' : 'INVALID_JSON',
      correlationId: request.correlationId,
    });
  });
  app.useGlobalFilters(new SafeExceptionFilter());
  await app.init();
  return app;
}
