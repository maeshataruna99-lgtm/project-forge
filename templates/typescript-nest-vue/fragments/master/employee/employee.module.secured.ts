import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({ imports: [AuthModule, PrismaModule], controllers: [EmployeeController], providers: [EmployeeService] })
export class EmployeeModule {}
