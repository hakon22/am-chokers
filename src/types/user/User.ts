import { InitialState } from '@/types/InitialState';
import RolesEnum from '@server/types/user/enum/RolesEnum';

export type User = {
  id?: number;
  username: string;
  password: string;
  phone: string;
  token: string;
  role: RolesEnum;
  refreshToken: string;
  telegramId: string | null;
};

export type UserInitialState = InitialState & {
  id?: number;
  token?: string;
  refreshToken?: string;
  email?: string;
  username?: string;
  phone?: string;
  key?: string;
  role?: RolesEnum;
  telegramId?: string | null;
  [key: string]: number[] | string[] | string | number | null | boolean | undefined;
};

export type UserProfileType = {
  password?: string;
  confirmPassword?: string;
  oldPassword?: string;
};
