import type { Dispatch, SetStateAction } from 'react';

import type { PublishTelegramInterface } from '@/slices/appSlice';
import type { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export interface PublicationDateFormInterface {
  publicationDate: Date | null;
  publicationTime: string | null;
}

export interface ItemAdminPublishModalProps {
  publishData: PublishTelegramInterface;
  publicationDate: Date | null;
  setPublicationDate: Dispatch<SetStateAction<Date | null>>;
  isTgPublish: boolean;
  setIsTgPublish: Dispatch<SetStateAction<boolean>>;
  onPublish: (values: PublishTelegramInterface) => void;
  onPublicationDateUpdate: (values: PublicationDateFormInterface) => void;
  generateDescription: () => void;
  lang: UserLangEnum;
  /** Оформление модалок в стиле темы v2 (карточка товара). По умолчанию — прежний вид. */
  uiVariant?: 'default' | 'v2';
}
