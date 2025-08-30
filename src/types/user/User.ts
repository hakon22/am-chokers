import type { UserEntity } from '@server/db/entities/user.entity';
import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface UserInterface extends OmitBase<UserEntity> {
  /** Токен пользователя */
  token: string;
  /** Refresh токен пользователя */
  refreshToken: string;
  /** Уникальный ключ пользователя (для кода подтверждения телефона) */
  key: string;
  /** Адрес для переадресации после входа */
  url: string;
  favorites: ItemEntity[];
  [key: string]: any;
}

export type UserFormInterface = Pick<UserEntity, 'name' | 'phone' | 'password' | 'lang'>;

export interface UserProfileType extends Partial<UserFormInterface> {
  confirmPassword?: string;
  oldPassword?: string;
  [key: string]: string | undefined;
}

export type UserLoginInterface = Omit<UserFormInterface, 'name'>;

export interface UserSignupInterface extends UserFormInterface {
  confirmPassword: string;
}

export interface FetchUserInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
}

export interface UserCardInterface extends Omit<OmitBase<UserEntity>, 'password' | 'deleted' | 'refreshTokens' | 'setAccessLevel'> {
  amount: number;
  gradeCount: number;
  messageCount: number;
  cartCount: number;
}
