import { Controller, Get } from '@nestjs/common';
import type { HealthResponse } from '@__PROJECT_NAME__/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    return { status: 'ok' };
  }
}
