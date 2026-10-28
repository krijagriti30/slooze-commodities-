import { Field, ID, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

registerEnumType(Role, { name: 'Role' });

@ObjectType('User')
export class UserModel {
  @Field(() => ID) id: string;
  @Field() email: string;
  @Field() name: string;
  @Field(() => Role) role: Role;
}

@InputType()
export class LoginInput {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;

  @Field()
  @IsString()
  @MinLength(1, { message: 'Password is required.' })
  @MaxLength(200)
  password: string;
}

export type SessionUser = { id: string; email: string; name: string; role: Role };
