import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export type AuthIdentity = { userId: string; companyId: string; systemRole: 'member' | 'company-admin' | 'root' };
export type TokenKind = 'access' | 'refresh';
type TokenClaims = AuthIdentity & { sub: string; type: TokenKind; iat: number; exp: number };

const ACCESS_SECONDS = 15 * 60;
const REFRESH_SECONDS = 7 * 24 * 60 * 60;

export function hashPassword(password: string): string {
  if (password.length < 12 || password.length > 128) throw new Error('Password must contain 12 to 128 characters');
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, saltText, hashText, extra] = encoded.split('$');
  if (algorithm !== 'scrypt' || !saltText || !hashText || extra !== undefined) return false;
  try {
    const salt = Buffer.from(saltText, 'base64url');
    const expected = Buffer.from(hashText, 'base64url');
    if (salt.length !== 16 || expected.length !== 64) return false;
    const actual = scryptSync(password, salt, expected.length, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function secretKey(secret: string): Buffer {
  if (secret.length < 32) throw new Error('AUTH_SECRET must be at least 32 characters');
  return Buffer.from(secret, 'utf8');
}

function encode(value: object): string { return Buffer.from(JSON.stringify(value)).toString('base64url'); }

export function signToken(identity: AuthIdentity, secret: string, type: TokenKind, now = Date.now()): string {
  const issued = Math.floor(now / 1000);
  const claims: TokenClaims = {
    ...identity,
    sub: identity.userId,
    type,
    iat: issued,
    exp: issued + (type === 'access' ? ACCESS_SECONDS : REFRESH_SECONDS),
  };
  const body = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(claims)}`;
  const signature = createHmac('sha256', secretKey(secret)).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyToken(token: string, secret: string, expectedType: TokenKind, now = Date.now()): AuthIdentity | null {
  try {
    if (token.length > 2048) return null;
    const [header, payload, signature, extra] = token.split('.');
    if (!header || !payload || !signature || extra !== undefined) return null;
    const body = `${header}.${payload}`;
    const actual = Buffer.from(signature, 'base64url');
    const expected = createHmac('sha256', secretKey(secret)).update(body).digest();
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as { alg?: string; typ?: string };
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<TokenClaims>;
    if (parsedHeader.alg !== 'HS256' || parsedHeader.typ !== 'JWT' || claims.type !== expectedType ||
      typeof claims.userId !== 'string' || !claims.userId || claims.sub !== claims.userId ||
      typeof claims.companyId !== 'string' || !claims.companyId ||
      (claims.systemRole !== 'member' && claims.systemRole !== 'company-admin' && claims.systemRole !== 'root') ||
      typeof claims.exp !== 'number' || claims.exp <= Math.floor(now / 1000)) return null;
    return { userId: claims.userId, companyId: claims.companyId, systemRole: claims.systemRole };
  } catch {
    return null;
  }
}

export class AuthService {
  constructor(private readonly secret = process.env.AUTH_SECRET ?? '') { secretKey(secret); }
  issue(identity: AuthIdentity) {
    return {
      accessToken: signToken(identity, this.secret, 'access'),
      refreshToken: signToken(identity, this.secret, 'refresh'),
      tokenType: 'Bearer' as const,
      expiresIn: ACCESS_SECONDS,
    };
  }
  verifyAccess(token: string): AuthIdentity | null { return verifyToken(token, this.secret, 'access'); }
  verifyRefresh(token: string): AuthIdentity | null { return verifyToken(token, this.secret, 'refresh'); }
}
