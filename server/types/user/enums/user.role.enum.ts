export enum UserRoleEnum {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export const translateUserRoleEnum: Record<UserRoleEnum, string> = {
  [UserRoleEnum.ADMIN]: 'Администратор',
  [UserRoleEnum.MEMBER]: 'Пользователь',
};
