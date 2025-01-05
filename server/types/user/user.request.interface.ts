import type { UserEntity } from '@server/db/entities/user.entity';

export interface PassportRequestInterface extends UserEntity {
  token: string;
  refreshToken: string;
}
