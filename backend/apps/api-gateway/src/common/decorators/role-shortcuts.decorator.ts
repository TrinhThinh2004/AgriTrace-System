import { applyDecorators } from '@nestjs/common';
import { Role } from '../enums';
import { Roles } from './roles.decorator';

/**
 * Shortcut decorators cho từng phân hệ.
 * ADMIN mặc định luôn được bypass trong RolesGuard, nên không cần liệt kê.
 */
export const AdminOnly     = () => applyDecorators(Roles(Role.ADMIN));
export const FarmerOnly    = () => applyDecorators(Roles(Role.FARMER));
export const InspectorOnly = () => applyDecorators(Roles(Role.INSPECTOR));
