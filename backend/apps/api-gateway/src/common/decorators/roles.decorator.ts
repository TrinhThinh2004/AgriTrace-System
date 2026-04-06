import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums';

/**
 * Custom decorator — gắn metadata roles lên handler.
 * Usage: @Roles(Role.ADMIN, Role.FARMER)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
