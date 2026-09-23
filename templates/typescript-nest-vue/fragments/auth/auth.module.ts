import { Module } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthService } from './auth.service';
import { CompanyService } from '../company/company.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthRateLimitGuard, CompanyService, { provide: PrismaClient, useFactory: () => new PrismaClient() }],
  exports: [AuthService, AuthGuard, CompanyService, PrismaClient],
})
export class AuthModule {}
