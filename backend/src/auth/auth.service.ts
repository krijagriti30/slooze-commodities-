import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma.service';
import { gqlError } from '../common/errors';
import type { SessionUser } from './auth.types';

const COOKIE = process.env.SESSION_COOKIE_NAME ?? 'slooze_sid';
const TTL_MS = Number(process.env.SESSION_TTL_HOURS ?? 12) * 3600_000;
// Compared against when the email is unknown so response time does not reveal valid accounts.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60_000;

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

@Injectable()
export class AuthService {
  private attempts = new Map<string, { count: number; reset: number }>();
  constructor(private prisma: PrismaService) {}

  private cookieOptions() {
    const prod = process.env.NODE_ENV === 'production';
    const sameSite = (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none';
    return { httpOnly: true, secure: prod || sameSite === 'none', sameSite, path: '/' };
  }

  private throttle(key: string) {
    const now = Date.now();
    const rec = this.attempts.get(key);
    if (!rec || rec.reset < now) {
      this.attempts.set(key, { count: 1, reset: now + WINDOW_MS });
      return;
    }
    rec.count += 1;
    if (rec.count > MAX_ATTEMPTS) {
      throw gqlError('Too many login attempts. Try again in a few minutes.', 'TOO_MANY_ATTEMPTS');
    }
  }

  async login(email: string, password: string, req: Request, res: Response): Promise<SessionUser> {
    this.throttle(`${req.ip}|${email}`);
    const user = await this.prisma.user.findUnique({ where: { email } });
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw gqlError('Invalid email or password.', 'INVALID_CREDENTIALS');

    this.attempts.delete(`${req.ip}|${email}`);
    const token = randomBytes(32).toString('base64url');
    await this.prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    await this.prisma.session.create({
      data: { tokenHash: sha256(token), userId: user.id, expiresAt: new Date(Date.now() + TTL_MS) },
    });
    res.cookie(COOKIE, token, { ...this.cookieOptions(), maxAge: TTL_MS });
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[COOKIE] as string | undefined;
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
    res.clearCookie(COOKIE, this.cookieOptions());
  }

  async userFromRequest(req: Request): Promise<SessionUser | null> {
    const token = req.cookies?.[COOKIE] as string | undefined;
    if (!token) return null;
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: sha256(token) },
      include: { user: true },
    });
    if (!session) return null;
    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
      return null;
    }
    const { id, email, name, role } = session.user;
    return { id, email, name, role };
  }
}
