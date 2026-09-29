import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeService } from './employee.service';

@Controller('master/employees')
export class EmployeeController {
  constructor(private readonly employees: EmployeeService) {}

  @Get()
  list() {
    return this.employees.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.employees.get(id);
  }

  @Post()
  create(@Body() input: CreateEmployeeDto) {
    return this.employees.create(input);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() input: UpdateEmployeeDto) {
    return this.employees.update(id, input);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    await this.employees.remove(id);
  }
}
