import { describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../../database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService } from './employee.service';

describe('employee service tenant scope', () => {
  it('scopes list, get, update, and delete to the verified company', async () => {
    const row = { id: 'employee-1', companyId: 'company-a' };
    const employee = {
      findMany: vi.fn().mockResolvedValue([row]),
      findFirst: vi.fn().mockResolvedValue(row),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
    };
    const prisma = { employee } as unknown as PrismaService;
    const service = new EmployeeService(prisma);

    await service.list('company-a');
    await service.get('employee-1', 'company-a');
    await service.update('employee-1', { position: 'Lead' } as UpdateEmployeeDto, 'company-a');
    await service.remove('employee-1', 'company-a');

    expect(employee.findMany).toHaveBeenCalledWith({ where: { companyId: 'company-a' }, orderBy: { name: 'asc' } });
    expect(employee.findFirst).toHaveBeenCalledWith({ where: { id: 'employee-1', companyId: 'company-a' } });
    expect(employee.updateMany).toHaveBeenCalledWith({ where: { id: 'employee-1', companyId: 'company-a' }, data: { position: 'Lead' } });
    expect(employee.deleteMany).toHaveBeenCalledWith({ where: { id: 'employee-1', companyId: 'company-a' } });
  });

  it('sets ownership from the verified company when creating an employee', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-a' });
    const service = new EmployeeService({ employee: { create } } as unknown as PrismaService);
    const input = { name: 'Ada', email: 'ada@example.com', position: 'Ops' } as CreateEmployeeDto;

    await service.create(input, 'company-a');

    expect(create).toHaveBeenCalledWith({ data: { ...input, companyId: 'company-a' } });
  });
});
