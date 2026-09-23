import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import type { AuthIdentity } from '../auth/auth.service';

const sensitiveKey = /password|token|secret|authorization|cookie|credential/i;

export function redactAuditMetadata(input: unknown, depth = 0): unknown {
  if (depth > 4) return '[truncated]';
  if (input === null || typeof input === 'boolean' || typeof input === 'number') return input;
  if (typeof input === 'string') return input.slice(0, 500);
  if (Array.isArray(input)) return input.slice(0, 50).map(value => redactAuditMetadata(value, depth + 1));
  if (typeof input !== 'object') return String(input).slice(0, 100);
  return Object.fromEntries(Object.entries(input).slice(0, 50).map(([key, value]) => [
    key,
    sensitiveKey.test(key) ? '[redacted]' : redactAuditMetadata(value, depth + 1),
  ]));
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  record(identity: AuthIdentity, event: { action: string; targetType: string; targetId?: string; metadata?: unknown }) {
    return this.prisma.auditEvent.create({
      data: {
        companyId: identity.companyId,
        actorUserId: identity.userId,
        action: event.action.slice(0, 100),
        targetType: event.targetType.slice(0, 100),
        targetId: event.targetId?.slice(0, 200),
        metadata: redactAuditMetadata(event.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  list(identity: AuthIdentity) {
    return this.prisma.auditEvent.findMany({
      where: { companyId: identity.companyId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
