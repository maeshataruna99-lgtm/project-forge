import { Injectable, Logger, type LoggerService } from '@nestjs/common';

export function redactLogMessage(value: unknown): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.replace(/("?(?:password|token|secret|authorization|cookie)"?\s*[:=]\s*)("[^"]*"|'[^']*'|[^,\s}]+)/gi, '$1[REDACTED]');
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly logger = new Logger('ProjectForge');
  log(message: unknown, context?: string) { this.logger.log(redactLogMessage(message), context); }
  error(message: unknown, trace?: string, context?: string) { this.logger.error(redactLogMessage(message), trace, context); }
  warn(message: unknown, context?: string) { this.logger.warn(redactLogMessage(message), context); }
  debug(message: unknown, context?: string) { this.logger.debug(redactLogMessage(message), context); }
  verbose(message: unknown, context?: string) { this.logger.verbose(redactLogMessage(message), context); }
  fatal(message: unknown, context?: string) { this.logger.fatal(redactLogMessage(message), context); }
}
