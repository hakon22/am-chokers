import type { UserEntity } from '@server/db/entities/user.entity';

export interface PassportRequestInterface {
  user: UserEntity;
  token: string;
  refreshToken: string;
}
