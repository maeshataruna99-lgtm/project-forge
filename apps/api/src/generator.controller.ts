import { Body, Controller, Get, HttpException, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { catalog } from '@project-forge/template-registry';
import { ConfigurationError, createArchiveAsync, createPlan, GenerationError } from '@project-forge/generator-core';

type CorrelatedRequest = Request & { correlationId?: string };
let activeArchives = 0;
const MAX_CONCURRENT_ARCHIVES = 1;

function handleGenerationError(error: unknown): never {
  if (error instanceof ConfigurationError) {
    throw new HttpException({ code: 'INVALID_CONFIGURATION', issues: error.issues }, 400);
  }
  if (error instanceof GenerationError) throw new HttpException({ code: 'GENERATION_FAILED' }, 500);
  throw error;
}

@Controller()
export class GeneratorController {
  @Get('health')
  health() { return { status: 'ok' }; }

  @Get('generator/catalog')
  getCatalog() { return catalog; }

  @Post('generator/validate')
  validate(@Body() input: unknown) {
    try { return createPlan(input); }
    catch (error) { handleGenerationError(error); }
  }

  @Post('generator/archive')
  async archive(@Body() input: unknown, @Req() _request: CorrelatedRequest, @Res() response: Response) {
    if (activeArchives >= MAX_CONCURRENT_ARCHIVES) throw new HttpException({ code: 'GENERATOR_BUSY' }, 429);
    activeArchives += 1;
    try {
      const plan = createPlan(input);
      const bytes = await createArchiveAsync(input);
      response.setHeader('Content-Type', 'application/zip');
      response.setHeader('Content-Disposition', `attachment; filename="${plan.projectName}.zip"`);
      response.setHeader('Content-Length', bytes.length);
      response.status(201).send(Buffer.from(bytes));
    } catch (error) {
      handleGenerationError(error);
    } finally {
      activeArchives -= 1;
    }
  }
}
