import { describe, expect, it } from 'vitest';
import { AuditService, redactAuditMetadata } from './audit.service';

describe('audit metadata', () => {
  it('redacts credentials recursively and bounds retained metadata', () => {
    expect(redactAuditMetadata({ action: 'updated', token: 'private', nested: { passwordHash: 'private', count: 2 } })).toEqual({
      action: 'updated', token: '[redacted]', nested: { passwordHash: '[redacted]', count: 2 },
    });
    expect(redactAuditMetadata({ value: 'x'.repeat(600) })).toEqual({ value: 'x'.repeat(500) });
    const deep = { a: { b: { c: { d: { e: 'deep' } } } } };
    expect(redactAuditMetadata(deep)).toEqual({ a: { b: { c: { d: { e: '[truncated]' } } } } });
  });

  it('derives audit actor and company from verified identity and stores redacted metadata', async () => {
    let saved: unknown;
    const service = new AuditService({ auditEvent: { create: async ({ data }: { data: unknown }) => { saved = data; return data; } } } as never);
    const identity = { userId: 'actor-a', companyId: 'company-a', systemRole: 'company-admin' as const };
    await service.record(identity, { action: 'project.update', targetType: 'project', metadata: { accessToken: 'private', changed: true } });
    expect(saved).toMatchObject({ companyId: 'company-a', actorUserId: 'actor-a', metadata: { accessToken: '[redacted]', changed: true } });
  });
});
