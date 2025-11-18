import type { OptionsTelegramMessageInterface } from '@server/services/integration/telegram.service';

export interface TelegramJobInterface {
  message: string | string[];
  telegramId: string;
  images?: string[];
  options?: OptionsTelegramMessageInterface;
}
