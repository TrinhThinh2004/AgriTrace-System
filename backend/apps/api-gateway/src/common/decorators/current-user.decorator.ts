import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator — trích xuất user từ request (Passport inject).
 * Usage: @CurrentUser() user: User
 * Hoặc:  @CurrentUser('email') email: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
