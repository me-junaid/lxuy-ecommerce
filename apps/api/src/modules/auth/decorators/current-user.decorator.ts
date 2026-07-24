import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const requestValue: unknown = ctx.switchToHttp().getRequest();
    const request = requestValue as { user?: Record<string, unknown> };
    const user = request.user;

    return data && user ? user[data] : user;
  },
);
