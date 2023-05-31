import { SetMetadata } from '@nestjs/common';
/**
 * Define an access information required for this route.
 * Notice that all Roles must be satisfied/passed
 */
export const CUseRoles = (...roles: string[]) => SetMetadata('roles', roles);
