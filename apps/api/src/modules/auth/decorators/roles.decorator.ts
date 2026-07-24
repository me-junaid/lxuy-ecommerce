import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: ('customer' | 'store_manager' | 'admin')[]) =>
  SetMetadata(ROLES_KEY, roles);
