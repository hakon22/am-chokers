import _ from 'lodash';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { Telegraf } from 'telegraf';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';
import type { ExtraReplyMessage, MediaGroup } from 'telegraf/typings/telegram-types';
import type { Context } from 'telegraf';

import { LoggerService } from '@server/services/app/logger.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { isTelegramDevOutboundAllowlistedChatId, isUserOutboundMessagingSkipped } from '@server/utilities/is-user-outbound-messaging-skipped';
import { resolveTelegramWebAppPublicOrigin } from '@server/utilities/telegram-web-app-public-origin';
import { routes } from '@/routes';

export type TelegramBotInitMode = 'development' | 'production' | 'outboundOnly';

@Singleton
export class TelegramBotService {
  private readonly TAG = 'TelegramBotService';

  private readonly loggerService = Container.get(LoggerService);

  private bot: Telegraf<Context> | null = null;

  private readonly proxyAgent = process.env.PROXY_USER && process.env.PROXY_PASS && process.env.PROXY_HOST
    ? new HttpsProxyAgent(`http://${process.env.PROXY_USER}:${process.env.PROXY_PASS}@${process.env.PROXY_HOST}`)
    : null;

  /**
   * Возвращает экземпляр Telegraf после init
   * @returns инициализированный бот
   */
  public getBot = (): Telegraf<Context> => {
    if (!this.bot) {
      throw new Error('Telegram bot is not initialized, call init() with TELEGRAM_TOKEN set');
    }
    return this.bot;
  };

  /**
   * Сбрасывает и заново выставляет команды меню в scope default (общий список для всех чатов)
   * @returns Promise, завершающийся после ответа Bot API
   */
  private syncDefaultCommandMenu = async (): Promise<void> => {
    if (!this.bot) {
      return;
    }
    const defaultScope = { type: 'default' as const };
    await this.bot.telegram.deleteMyCommands({ scope: defaultScope }).catch(() => {
      this.loggerService.error(this.TAG, 'Ошибка при сбросе команд меню');
    });
    await this.bot.telegram.setMyCommands([{
      command: 'start',
      description: '🔃 Запуск бота',
    }], { scope: defaultScope });
    this.loggerService.info(this.TAG, 'Telegram: меню команд (scope default) синхронизировано');
  };

  /**
   * Устанавливает кнопку меню по умолчанию с Mini App «Заказы»
   * @returns Promise после ответа Bot API или раннего выхода при отсутствии URL
   */
  private setDefaultWebAppMenuButton = async (): Promise<void> => {
    if (!this.bot) {
      return;
    }

    const publicOrigin = resolveTelegramWebAppPublicOrigin();
    const miniAppUrl = !_.isEmpty(publicOrigin) ? `${publicOrigin}${routes.page.telegram.orders}` : '';

    if (_.isEmpty(miniAppUrl)) {
      this.loggerService.warn(
        this.TAG,
        'Публичный URL для Telegram Web App не задан (serverHost / NEXT_PUBLIC_TELEGRAM_WEB_APP_ORIGIN), пропуск setChatMenuButton',
      );
      return;
    }

    try {
      await this.bot.telegram.setChatMenuButton({
        menuButton: {
          type: 'web_app',
          text: 'Мои заказы',
          web_app: { url: miniAppUrl },
        },
      });
      this.loggerService.info(this.TAG, 'Telegram: кнопка меню Web App (Мои заказы) установлена');
    } catch (error) {
      this.loggerService.error(this.TAG, 'setChatMenuButton (Web App) failed', error);
    }
  };

  /**
   * Создаёт бота, команды, webhook (production) или long polling (development); outboundOnly — только исходящие API
   * @param options - режим работы: development | production | outboundOnly (по умолчанию outboundOnly)
   */
  public init = async (options?: { mode?: TelegramBotInitMode; }) => {
    const mode = options?.mode ?? 'outboundOnly';
    const token = process.env.TELEGRAM_TOKEN ?? '';

    if (!token) {
      this.loggerService.warn(this.TAG, 'TELEGRAM_TOKEN is not set, Telegram bot is not initialized');
      return;
    }

    this.stopBot('reinit');
    this.bot = null;

    try {
      this.bot = new Telegraf(token, this.proxyAgent
        ? {
          telegram: {
            agent: this.proxyAgent,
          },
        }
        : {});

      if (mode === 'development' || mode === 'production') {
        Container.get(TelegramService).registerInboundHandlersOnBot(this.bot);
        await this.syncDefaultCommandMenu();
        await this.setDefaultWebAppMenuButton();
      }

      if (mode === 'production') {
        await this.bot.telegram.setWebhook(`${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${routes.integration.telegram.webhook}`);
        this.loggerService.info(this.TAG, 'Telegram bot initialized (production webhook)');
      } else if (mode === 'development') {
        await this.startLongPollingInDevelopment();
      } else {
        this.loggerService.info(this.TAG, 'Telegram bot initialized (outbound only)');
      }
    } catch (error) {
      this.loggerService.error(this.TAG, error);
    }
  };

  /**
   * Development: сбрасывает webhook и запускает long polling
   */
  public startLongPollingInDevelopment = async (): Promise<void> => {
    if (!this.bot) {
      return;
    }
    await this.bot.telegram.deleteWebhook();
    this.bot.launch().catch((error) => {
      this.loggerService.error(this.TAG, 'Long polling: launch error', error);
    });
    this.loggerService.info(this.TAG, 'Telegram: long polling started (development)');
  };

  /**
   * Обрабатывает POST вебхука в production
   * @param req - HTTP-запрос с телом Update
   * @param res - HTTP-ответ
   */
  public handleWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
      const telegraf = this.getBot();
      await telegraf.handleUpdate(req.body);
      res.sendStatus(200);
    } catch (error) {
      this.loggerService.error(this.TAG, error);
      res.sendStatus(500);
    }
  };

  /**
   * Останавливает long polling и освобождает ресурсы Telegraf
   * @param reason - необязательная причина остановки (например сигнал ОС)
   */
  public stopBot = (reason?: string): void => {
    this.bot?.stop(reason);
  };

  /**
   * Отправляет текстовое сообщение пользователю Telegram
   * @param text - текст HTML
   * @param telegramId - id чата
   * @param options - дополнительные опции Telegraf
   * @returns результат sendMessage
   */
  public sendMessage = async (text: string, telegramId: string, options?: ExtraReplyMessage) => {
    if (isUserOutboundMessagingSkipped() && !isTelegramDevOutboundAllowlistedChatId(telegramId)) {
      this.loggerService.info(
        this.TAG,
        `Пропуск Telegram sendMessage (небоевое окружение): telegramId=${telegramId}`,
      );
      return undefined;
    }

    try {
      return this.getBot().telegram.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, error);
      throw error;
    }
  };

  /**
   * Отправляет медиагруппу в Telegram
   * @param media - элементы медиагруппы
   * @param telegramId - id чата
   * @param options - дополнительные опции
   * @returns результат sendMediaGroup
   */
  public sendMediaGroup = async (media: MediaGroup, telegramId: string, options?: ExtraReplyMessage) => {
    if (isUserOutboundMessagingSkipped() && !isTelegramDevOutboundAllowlistedChatId(telegramId)) {
      this.loggerService.info(
        this.TAG,
        `Пропуск Telegram sendMediaGroup (небоевое окружение): telegramId=${telegramId}`,
      );
      return undefined;
    }

    try {
      return this.getBot().telegram.sendMediaGroup(telegramId, media, {
        parse_mode: 'HTML',
        ...options,
      });
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, error);
      throw error;
    }
  };
}
