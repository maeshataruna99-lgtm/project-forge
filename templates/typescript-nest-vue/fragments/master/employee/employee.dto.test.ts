import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { ValidationPipe } from '@nestjs/common';
import { validate } from 'class-validator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { PrismaService } from '../../database/prisma.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('employee DTO validation', () => {
  it('declares runtime injection tokens for tsx without design:paramtypes metadata', () => {
    expect(Reflect.getMetadata('self:paramtypes', EmployeeService)).toEqual([
      { index: 0, param: PrismaService },
    ]);
    expect(Reflect.getMetadata('self:paramtypes', EmployeeController)).toEqual([
      { index: 0, param: EmployeeService },
    ]);
  });

  it('validates body input with an explicit DTO type when design metadata is missing', async () => {
    const pipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      expectedType: CreateEmployeeDto,
    });
    const metadata = { type: 'body' as const };

    await expect(pipe.transform({ name: 'A', email: 'a@example.com', position: 'Ops', companyId: 'tenant-a' }, metadata))
      .rejects.toBeDefined();
    const valid = await pipe.transform({ name: 'Ada', email: 'ada@example.com', position: 'Ops' }, metadata);
    expect(valid).toBeInstanceOf(CreateEmployeeDto);
  });
  it('allows every update field to be omitted', async () => {
    await expect(validate(new UpdateEmployeeDto())).resolves.toEqual([]);
  });

  it('rejects invalid required create fields', async () => {
    const dto = Object.assign(new CreateEmployeeDto(), {
      name: '',
      email: 'not-an-email',
      position: '',
    });

    const errors = await validate(dto);
    expect(errors.map(error => error.property)).toEqual(
      expect.arrayContaining(['name', 'email', 'position']),
    );
  });

  it.each([
    ['name', ''],
    ['position', ''],
    ['email', 'not-an-email'],
    ['name', null],
    ['position', null],
    ['email', null],
  ])('rejects invalid update field %s', async (field, value) => {
    const dto = Object.assign(new UpdateEmployeeDto(), { [field]: value });
    const errors = await validate(dto);
    expect(errors.map(error => error.property)).toContain(field);
  });
});
