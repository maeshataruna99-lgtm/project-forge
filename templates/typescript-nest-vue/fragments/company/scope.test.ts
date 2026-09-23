import { describe, expect, it } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CompanyService } from './company.service';

describe('company service', () => {
  it('uses the verified company identity for read and write predicates', () => {
    const companies = [{ companyId: 'company-a', value: 'private-a' }, { companyId: 'company-b', value: 'private-b' }];
    const service = new CompanyService();
    const identity = { userId: 'user-a', companyId: 'company-a', systemRole: 'member' as const };
    const where = service.where(identity);
    expect(companies.filter(item => item.companyId === where.companyId)).toEqual([companies[0]]);
    expect(service.scopedQuery(identity, { companyId: 'company-b', value: 'changed' })).toEqual({ companyId: 'company-a', value: 'changed' });
    expect(() => service.where(identity, 'company-b')).toThrow(ForbiddenException);
  });
});
