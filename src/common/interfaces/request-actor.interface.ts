import { Role } from '../enums/role.enum';

export interface RequestActor {
  userId: string;
  email: string;
  role: Role;
  ibpNumber: string;
}
