export enum UserLangEnum {
  /** Русский */
  RU = 'RU',
  /** Английский */
  EN = 'EN',
}

export const translateUserLangEnum: Record<UserLangEnum, string> = {
  [UserLangEnum.RU]: 'Русский',
  [UserLangEnum.EN]: 'Английский',
};
