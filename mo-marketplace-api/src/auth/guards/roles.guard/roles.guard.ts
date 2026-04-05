import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/common/enums';
import { ROLES_KEY } from '../../decorators/roles.decorator';

type AuthRequest = {
  user?: {
    role?: string;
  };
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRequest>();
    const role = request.user?.role;

    if (!role) {
      throw new ForbiddenException('No user role found in token payload');
    }

    if (!requiredRoles.includes(role as UserRole)) {
      throw new ForbiddenException(
        'Admin role required to perform this action',
      );
    }

    return true;
  }
}
