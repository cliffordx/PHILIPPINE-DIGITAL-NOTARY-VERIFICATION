import { SetMetadata } from '@nestjs/common';
import { LawyerRole } from '../entities/lawyer.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: LawyerRole[]) =>
  SetMetadata(ROLES_KEY, roles);
