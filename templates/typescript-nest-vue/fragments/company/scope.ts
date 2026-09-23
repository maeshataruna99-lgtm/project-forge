import type { AuthIdentity } from '../auth/auth.service';

export function resolveCompanyWhere(identity: AuthIdentity, requestedCompanyId?: string): { companyId: string } | null {
  if (requestedCompanyId && requestedCompanyId !== identity.companyId) return null;
  return { companyId: identity.companyId };
}

export function scopeQuery<T extends object>(identity: AuthIdentity, filters: T): T & { companyId: string } {
  return { ...filters, companyId: identity.companyId };
}
