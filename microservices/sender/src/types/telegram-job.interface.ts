import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';

import type { ItemEntity } from '@server/db/entities/item.entity';

export interface TelegramJobInterface {
  message: string | string[];
  telegramId: string;
  images?: string[];
  item?: ItemEntity;
  options?: ExtraReplyMessage;
}

export interface TelegramAdminJobInterface extends Pick<TelegramJobInterface, 'options'> {
  messageRu: string | string[];
  messageEn: string | string[];
}
