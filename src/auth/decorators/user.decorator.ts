import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedUser = {
  id: string;
};

type RequestWithUser = Request & {
  user: AuthenticatedUser;
};

export const User = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    return data ? user[data] : user;
  },
);
