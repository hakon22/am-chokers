import type { UserEntity } from '@server/db/entities/user.entity';
import type { OmitBase } from '@/types/OmitBase';

export interface UserInterface extends OmitBase<UserEntity> {
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

export type UserFormInterface = Pick<UserEntity, 'name' | 'phone' | 'password'>

export interface UserProfileType extends Partial<UserFormInterface> {
  confirmPassword?: string;
  oldPassword?: string;
  [key: string]: string | undefined;
}

export type UserLoginInterface = Omit<UserFormInterface, 'name'>

export interface UserSignupInterface extends UserFormInterface {
  confirmPassword: string;
}
