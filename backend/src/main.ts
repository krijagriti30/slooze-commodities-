import './common/env';
import 'reflect-metadata';
import { ValidationError, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { gqlError } from './common/errors';

function flatten(errors: ValidationError[], prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of errors) {
    const key = prefix ? `${prefix}.${e.property}` : e.property;
    const first = e.constraints && Object.values(e.constraints)[0];
    if (first) out[key] = first;
    if (e.children?.length) Object.assign(out, flatten(e.children, key));
  }
  return out;
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);
  app.use(cookieParser());
  const origins = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:3000').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true, methods: ['GET', 'POST', 'OPTIONS'] });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) =>
        gqlError('Please fix the highlighted fields.', 'BAD_USER_INPUT', { fields: flatten(errors) }),
    }),
  );
  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  console.log(`GraphQL API ready at http://localhost:${port}/graphql`);
}
void bootstrap();
