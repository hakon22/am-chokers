import type { UserEntity } from '@server/db/entities/user.entity';

export interface PassportRequestInterface extends Omit<UserEntity, 'password'> {
  token: string;
  refreshToken: string;
}
