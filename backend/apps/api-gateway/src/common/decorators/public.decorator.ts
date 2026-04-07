import { SetMetadata } from '@nestjs/common';

/**
 * Đánh dấu endpoint là public — bỏ qua JwtAuthGuard global.
 * Usage: @Public()
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
