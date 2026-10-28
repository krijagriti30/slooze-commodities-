import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { IS_PUBLIC, ROLES } from './auth.decorators';
import { gqlError } from '../common/errors';

/** Global guard: every operation needs a valid server-side session unless @Public(); @Roles() adds role checks. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private reflector: Reflector, private auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const { req } = GqlExecutionContext.create(context).getContext();
    const user = await this.auth.userFromRequest(req);
    req.user = user ?? undefined;

    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets)) return true;
    if (!user) throw gqlError('You must be signed in.', 'UNAUTHENTICATED');

    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES, targets);
    if (roles?.length && !roles.includes(user.role)) {
      throw gqlError('You do not have permission to access this resource.', 'FORBIDDEN');
    }
    return true;
  }
}
