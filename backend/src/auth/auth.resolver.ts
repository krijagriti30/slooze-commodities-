import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginInput, UserModel } from './auth.types';
import { Public } from './auth.decorators';

type Ctx = { req: Request & { user?: UserModel }; res: Response };

@Resolver()
export class AuthResolver {
  constructor(private auth: AuthService) {}

  @Public()
  @Mutation(() => UserModel)
  login(@Args('input') input: LoginInput, @Context() { req, res }: Ctx) {
    return this.auth.login(input.email, input.password, req, res);
  }

  @Public()
  @Mutation(() => Boolean)
  async logout(@Context() { req, res }: Ctx) {
    await this.auth.logout(req, res);
    return true;
  }

  /** Returns null (not an error) when signed out, so the client can bootstrap its auth state. */
  @Public()
  @Query(() => UserModel, { nullable: true })
  me(@Context() { req }: Ctx) {
    return req.user ?? null;
  }
}
