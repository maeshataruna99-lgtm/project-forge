import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, ValidationPipe, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../../auth/auth.guard';
import type { AuthIdentity } from '../../auth/auth.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService } from './employee.service';

type AuthenticatedRequest = Request & { user: AuthIdentity };

@Controller('master/employees')
@UseGuards(AuthGuard)
export class EmployeeController {
  constructor(@Inject(EmployeeService) private readonly employees: EmployeeService) {}

  @Get()
  list(@Req() request: AuthenticatedRequest) {
    return this.employees.list(request.user.companyId);
  }

  @Get(':id')
  get(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.employees.get(id, request.user.companyId);
  }

  @Post()
  create(@Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, expectedType: CreateEmployeeDto })) input: CreateEmployeeDto, @Req() request: AuthenticatedRequest) {
    return this.employees.create(input, request.user.companyId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, expectedType: UpdateEmployeeDto })) input: UpdateEmployeeDto, @Req() request: AuthenticatedRequest) {
    return this.employees.update(id, input, request.user.companyId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest): Promise<void> {
    await this.employees.remove(id, request.user.companyId);
  }
}
