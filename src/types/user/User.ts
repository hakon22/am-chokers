import type { InitialState } from '@/types/InitialState';
import type { UserEntity } from '@server/db/entities/user.entity';
import type { OmitBase } from '@/types/omitBase';

export interface UserInterface extends Omit<OmitBase<UserEntity>, 'refreshToken' | 'password'>, InitialState {
  /** Токен пользователя */
  token: string;
  /** Refresh токен пользователя */
  refreshToken: string;
  /** Уникальный ключ пользователя (для кода подтверждения телефона) */
  key: string;
  [key: string]: any;
}

export interface UserProfileType {
  password?: string;
  confirmPassword?: string;
  oldPassword?: string;
}

export interface UserFormInterface extends Pick<UserEntity, 'name' | 'phone' | 'password'> {}
