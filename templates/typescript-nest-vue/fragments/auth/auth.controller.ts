import { BadRequestException, Body, ConflictException, Controller, Get, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Request } from 'express';
import { AuthGuard } from './auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthService, hashPassword, verifyPassword, type AuthIdentity } from './auth.service';

type AuthenticatedRequest = Request & { user: AuthIdentity };

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly prisma: PrismaClient) {}

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() body: unknown) {
    if (!body || typeof body !== 'object') throw new BadRequestException('Company name, email, and password are required');
    const input = body as Record<string, unknown>;
    if (typeof input.companyName !== 'string' || input.companyName.trim().length < 2 || input.companyName.trim().length > 100 ||
      typeof input.email !== 'string' || input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) ||
      typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128) {
      throw new BadRequestException('Use a company name, valid email, and a password of 12 to 128 characters');
    }
    const email = input.email.trim().toLowerCase();
    const companyName = input.companyName.trim();
    const password = input.password;
    if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('An account already exists for this email');
    let created: { company: { id: string }; user: { id: string } };
    try {
      created = await this.prisma.$transaction(async transaction => {
        const company = await transaction.company.create({ data: { name: companyName } });
        const user = await transaction.user.create({ data: { email, passwordHash: hashPassword(password) } });
        await transaction.companyMembership.create({ data: { companyId: company.id, userId: user.id, role: 'ADMIN' } });
        return { company, user };
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('An account already exists for this email');
      }
      throw error;
    }
    return this.auth.issue({ userId: created.user.id, companyId: created.company.id, systemRole: 'company-admin' });
  }

  @Post('login')
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() body: unknown) {
    if (!body || typeof body !== 'object') throw new UnauthorizedException('Invalid email or password');
    const input = body as Record<string, unknown>;
    if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.password !== 'string' || input.password.length < 12 || input.password.length > 128 ||
      (input.companyId !== undefined && typeof input.companyId !== 'string')) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.trim().toLowerCase() },
      include: { memberships: true },
    });
    if (!user || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const matches = user.memberships.filter(membership => input.companyId === undefined || membership.companyId === input.companyId);
    if (matches.length !== 1) throw new UnauthorizedException('Invalid email or password');
    const membership = matches[0]!;
    const identity: AuthIdentity = {
      userId: user.id,
      companyId: membership.companyId,
      systemRole: membership.role === 'ADMIN' ? 'company-admin' : 'member',
    };
    return this.auth.issue(identity);
  }

  @Post('refresh')
  @UseGuards(AuthRateLimitGuard)
  refresh(@Body() body: unknown) {
    if (!body || typeof body !== 'object' || typeof (body as Record<string, unknown>).refreshToken !== 'string' || (body as { refreshToken: string }).refreshToken.length > 2048) {
      throw new UnauthorizedException('A valid refresh token is required');
    }
    const identity = this.auth.verifyRefresh((body as { refreshToken: string }).refreshToken);
    if (!identity) throw new UnauthorizedException('A valid refresh token is required');
    return this.auth.issue(identity);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@Req() request: AuthenticatedRequest): AuthIdentity {
    return request.user;
  }
}
