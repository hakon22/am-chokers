import type { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export interface ParamsIdInterface {
  id: number;
}

export interface ParamsIdStringInterface {
  id: string;
}

export interface NullableParamsIdInterface {
  id: number | null;
  lang: UserLangEnum;
}
