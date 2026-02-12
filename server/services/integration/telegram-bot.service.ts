import { SocksProxyAgent } from 'socks-proxy-agent';
import { Telegraf } from 'telegraf';
import { Container, Singleton } from 'typescript-ioc';
import type { ExtraReplyMessage, MediaGroup } from 'telegraf/typings/telegram-types';
import type { Context } from 'telegraf';

import { LoggerService } from '@server/services/app/logger.service';
import { routes } from '@/routes';

@Singleton
export class TelegramBotService {
  private readonly TAG = 'TelegramBotService';

  private readonly loggerService = Container.get(LoggerService);

  private bot: Telegraf<Context>;

  private readonly socksProxyAgent = process.env.PROXY_USER && process.env.PROXY_PASS && process.env.PROXY_HOST
    ? new SocksProxyAgent(`socks5://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}`)
    : null;

  public init = async (options?: { withWebhooks?: boolean; }) => {
    try {
      this.bot = new Telegraf(process.env.TELEGRAM_TOKEN ?? '', this.socksProxyAgent
        ? {
          telegram: {
            agent: this.socksProxyAgent,
          },
        }
        : {});

      if (options?.withWebhooks) {
        await this.bot.telegram.setMyCommands([{
          command: 'start',
          description: '🔃 Запуск бота',
        }]);
        await this.bot.telegram.setWebhook(`${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.integration.telegram.webhook}`);
      }
      this.loggerService.info(this.TAG, 'Telegram bot initialized');
    } catch (e) {
      this.loggerService.error(this.TAG, e);
    }
  };

  public sendMessage = async (text: string, telegramId: string, options?: ExtraReplyMessage) => {
    try {
      return this.bot.telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
      throw e;
    }
  };

  public sendMediaGroup = async (media: MediaGroup, telegramId: string, options?: ExtraReplyMessage) => {
    try {
      return this.bot.telegram.sendMediaGroup(telegramId, media, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
      throw e;
    }
  };
}
