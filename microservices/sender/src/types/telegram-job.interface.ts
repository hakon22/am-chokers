import type { Types } from 'telegraf';

import type { ItemEntity } from '@server/db/entities/item.entity';

export interface TelegramJobInterface {
  message: string | string[];
  telegramId: string;
  images?: string[];
  item?: ItemEntity;
  options?: Types.ExtraReplyMessage;
}

export interface TelegramAdminJobInterface extends Pick<TelegramJobInterface, 'options'> {
  messageRu: string | string[];
  messageEn: string | string[];
}
