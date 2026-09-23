import { expect, it } from 'vitest';
import { redactLogMessage } from './structured-logger';

it('redacts credential fields before writing log messages', () => {
  expect(redactLogMessage('{"password":"value","safe":"kept"}')).toBe('{"password":[REDACTED],"safe":"kept"}');
  expect(redactLogMessage('token=secret-value')).toBe('token=[REDACTED]');
});
