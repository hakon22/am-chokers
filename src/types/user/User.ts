import type { InitialState } from '@/types/InitialState';
import type { UserEntity } from '@server/db/entities/user.entity';
import type { OmitBase } from '@/types/omitBase';

export interface UserInterface extends Omit<OmitBase<UserEntity>, 'password'>, InitialState {
  /** Токен пользователя */
  token: string;
  /** Refresh токен пользователя */
  refreshToken: string;
  /** Уникальный ключ пользователя (для кода подтверждения телефона) */
  key: string;
  /** Адрес для переадресации после входа */
  url: string;
  [key: string]: any;
}

export interface UserProfileType extends Partial<Pick<UserEntity, 'name' | 'phone' | 'password'>> {
  confirmPassword?: string;
  oldPassword?: string;
  [key: string]: string | undefined;
}

export interface UserFormInterface extends Pick<UserEntity, 'name' | 'phone' | 'password'> {}

export interface UserLoginInterface extends Pick<UserEntity, 'phone' | 'password'> {}

export interface UserSignupInterface extends Pick<UserEntity, 'name' | 'phone' | 'password'> {
  confirmPassword: string;
};
