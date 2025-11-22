import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OptionsTelegramMessageInterface } from '@server/services/integration/telegram.service';

export interface TelegramJobInterface {
  message: string | string[];
  telegramId: string;
  images?: string[];
  item?: ItemEntity;
  options?: OptionsTelegramMessageInterface;
}

export interface TelegramAdminJobInterface extends Pick<TelegramJobInterface, 'options'> {
  messageRu: string | string[];
  messageEn: string | string[];
}
