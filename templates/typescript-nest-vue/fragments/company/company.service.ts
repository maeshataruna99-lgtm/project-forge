import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthIdentity } from '../auth/auth.service';
import { resolveCompanyWhere, scopeQuery } from './scope';

@Injectable()
export class CompanyService {
  where(identity: AuthIdentity, requestedCompanyId?: string): { companyId: string } {
    const where = resolveCompanyWhere(identity, requestedCompanyId);
    if (!where) {
      throw new ForbiddenException('The requested company is outside the authenticated identity scope');
    }
    return where;
  }

  scopedQuery<T extends object>(identity: AuthIdentity, filters: T): T & { companyId: string } {
    return scopeQuery(identity, filters);
  }
}
