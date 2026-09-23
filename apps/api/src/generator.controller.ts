import { Body, Controller, Get, HttpException, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { catalog } from '@project-forge/template-registry';
import { projectConfigSchema } from '@project-forge/contracts';
import { ConfigurationError, createArchiveAsync, createPlan, GenerationError } from '@project-forge/generator-core';
import { GitHubAuthorizationUnavailableError, GitHubDeviceAuthorizationService } from './github-device-authorization.service';
import { GithubOutputService } from './github-output.service';

type CorrelatedRequest = Request & { correlationId?: string };
let activeArchives = 0;
const MAX_CONCURRENT_ARCHIVES = 1;
let activeGithubOperations = 0;
const MAX_CONCURRENT_GITHUB_OPERATIONS = 1;
function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input);
}
function hasOnlyKeys(input: Record<string, unknown>, keys: string[]) {
  return Object.keys(input).every(key => keys.includes(key)) && keys.every(key => key in input);
}
function parseGithubBody(input: unknown) {
  if (!isRecord(input) || !hasOnlyKeys(input, ['confirmed', 'authorizationId', 'owner', 'name', 'visibility', 'config'])) return undefined;
  const config = projectConfigSchema.safeParse(input.config);
  if (typeof input.confirmed !== 'boolean' || typeof input.authorizationId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.authorizationId)
    || typeof input.owner !== 'string' || !/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(input.owner) || input.owner.length > 39
    || typeof input.name !== 'string' || !projectConfigSchema.shape.project.shape.name.safeParse(input.name).success
    || input.visibility !== 'public' || !config.success) return undefined;
  return { ...input, config: config.data, visibility: 'public' as const, owner: input.owner, name: input.name, confirmed: input.confirmed, authorizationId: input.authorizationId };
}
function parseDevicePoll(input: unknown): { authorizationId: string } | undefined {
  if (!isRecord(input) || !hasOnlyKeys(input, ['authorizationId']) || typeof input.authorizationId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.authorizationId)) return undefined;
  return { authorizationId: input.authorizationId };
}
const githubRateLimits = new Map<string, number[]>();

function limitGithubOperation(key: string, max = 5) {
  const now = Date.now();
  const remaining = (githubRateLimits.get(key) ?? []).filter(timestamp => now - timestamp < 60_000);
  if (remaining.length >= max) throw new HttpException({ code: 'GITHUB_RATE_LIMITED' }, 429);
  remaining.push(now);
  githubRateLimits.set(key, remaining);
}

function handleGenerationError(error: unknown): never {
  if (error instanceof ConfigurationError) {
    throw new HttpException({ code: 'INVALID_CONFIGURATION', issues: error.issues }, 400);
  }
  if (error instanceof GenerationError) throw new HttpException({ code: 'GENERATION_FAILED' }, 500);
  throw error;
}

@Controller()
export class GeneratorController {
  private readonly github = new GithubOutputService();
  private readonly githubAuthorization = new GitHubDeviceAuthorizationService();

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

  @Post('generator/github/device')
  async startGithubAuthorization(@Req() request: CorrelatedRequest) {
    limitGithubOperation(request.ip ?? 'unknown');
    try { return await this.githubAuthorization.start(); }
    catch (error) {
      if (error instanceof GitHubAuthorizationUnavailableError) throw new HttpException({ code: 'GITHUB_NOT_CONFIGURED' }, 503);
      throw new HttpException({ code: 'GITHUB_AUTHORIZATION_FAILED' }, 502);
    }
  }

  @Post('generator/github/device/poll')
  async pollGithubAuthorization(@Body() input: unknown, @Req() request: CorrelatedRequest) {
    limitGithubOperation(`poll:${request.ip ?? 'unknown'}`, 60);
    const parsed = parseDevicePoll(input);
    if (!parsed) throw new HttpException({ code: 'INVALID_GITHUB_AUTHORIZATION_REQUEST' }, 400);
    return this.githubAuthorization.poll(parsed.authorizationId);
  }

  @Post('generator/github')
  async createGithubRepository(@Body() input: unknown, @Req() request: CorrelatedRequest) {
    limitGithubOperation(request.ip ?? 'unknown');
    const parsed = parseGithubBody(input);
    if (!parsed) throw new HttpException({ code: 'INVALID_GITHUB_OUTPUT_REQUEST' }, 400);
    if (!parsed.confirmed) return { status: 'cancelled' as const };
    if (parsed.config.output.destination !== 'github') throw new HttpException({ code: 'GITHUB_DESTINATION_NOT_SELECTED' }, 400);
    if (activeGithubOperations >= MAX_CONCURRENT_GITHUB_OPERATIONS) throw new HttpException({ code: 'GITHUB_BUSY' }, 429);
    const accessToken = this.githubAuthorization.consume(parsed.authorizationId);
    if (!accessToken) return { status: 'unauthorized', message: 'GitHub authorization expired. Download the ZIP or reconnect.' };
    activeGithubOperations += 1;
    try {
      return await this.github.create({ ...parsed, accessToken });
    } finally {
      activeGithubOperations -= 1;
    }
  }
}
