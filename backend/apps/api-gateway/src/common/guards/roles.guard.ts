import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums';
import { IS_PUBLIC_KEY, ROLES_KEY } from '../decorators';

// Guard này sẽ kiểm tra xem user có role phù hợp để truy cập endpoint hay không.
// ADMIN luôn được bypass (super user).
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Public endpoint 
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // Lấy danh sách roles được phép từ @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có @Roles() → cho phép truy cập (chỉ cần JWT)
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.role) {
      throw new ForbiddenException('Bạn chưa được phân quyền để truy cập tài nguyên này');
    }

    // ADMIN luôn được phép
    if (user.role === Role.ADMIN) return true;

    const hasRole = requiredRoles.includes(user.role);

    if (!hasRole) {
      throw new ForbiddenException(
        `Role "${user.role}" không có quyền truy cập. Yêu cầu: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
