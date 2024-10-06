import type { InitialState } from '@/types/InitialState';
import type { UserEntity } from '@server/db/entities/user.entity';

export interface UserInterface extends Omit<UserEntity, 'refreshToken' | 'password'>, InitialState {
  /** Токен пользователя */
  token: string;
  /** Refresh токен пользователя */
  refreshToken: string;
  /** Уникальный ключ пользователя (для кода подтверждения телефона) */
  key: string;
  [key: string]: string | number | undefined | null;
}

export interface UserProfileType {
  password?: string;
  confirmPassword?: string;
  oldPassword?: string;
}
