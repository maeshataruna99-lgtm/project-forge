import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId?: string) {
    return this.prisma.employee.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async get(id: string, companyId?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  create(input: CreateEmployeeDto, companyId?: string) {
    return this.prisma.employee.create({
      data: { ...input, ...(companyId ? { companyId } : {}) },
    });
  }

  async update(id: string, input: UpdateEmployeeDto, companyId?: string) {
    const where = { id, ...(companyId ? { companyId } : {}) };
    const result = await this.prisma.employee.updateMany({ where, data: input });
    if (!result.count) throw new NotFoundException('Employee not found');
    return this.get(id, companyId);
  }

  async remove(id: string, companyId?: string): Promise<void> {
    const result = await this.prisma.employee.deleteMany({
      where: { id, ...(companyId ? { companyId } : {}) },
    });
    if (!result.count) throw new NotFoundException('Employee not found');
  }
}
