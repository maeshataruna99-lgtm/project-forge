import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthService } from './auth.service';
import { CompanyService } from '../company/company.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard, AuthRateLimitGuard, CompanyService],
  exports: [AuthService, AuthGuard, CompanyService, PrismaModule],
})
export class AuthModule {}
