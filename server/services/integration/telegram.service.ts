import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { Context, Telegraf } from 'telegraf';
import type { Message } from 'typegram/message';
import type { ExtraReplyMessage } from 'telegraf/typings/telegram-types';
import type { InputMediaPhoto, InputMediaVideo } from 'telegraf/types';

import { UserEntity } from '@server/db/entities/user.entity';
import { ItemEntity } from '@server/db/entities/item.entity';
import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { MessageService } from '@server/services/message/message.service';
import { RedisService } from '@server/db/redis.service';
import { TelegramBotService } from '@server/services/integration/telegram-bot.service';
import { resolveTelegramWebAppPublicOrigin } from '@server/utilities/telegram-web-app-public-origin';
import { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';
import { routes, serverHost } from '@/routes';

const TELEGRAM_LINK_TOKEN_PREFIX = 'TELEGRAM_LINK_TOKEN:';

const START_COMMAND_PATTERN = /^\/start(?:@\w+)?(?:\s+(\S+))?$/;

interface TelegramLinkTokenRedisValue {
  userId: number;
}

@Singleton
export class TelegramService {
  private readonly TAG = 'TelegramService';

  private readonly loggerService = Container.get(LoggerService);

  private readonly messageService = Container.get(MessageService);

  private readonly redisService = Container.get(RedisService);

  private readonly telegramBotService = Container.get(TelegramBotService);

  /**
   * Регистрирует на экземпляре Telegraf middleware для входящих апдейтов (polling и webhook)
   * @param bot - бот после инициализации в TelegramBotService
   */
  public registerInboundHandlersOnBot = (bot: Telegraf<Context>): void => {
    bot.use(async (context, next) => {
      try {
        await this.handleIncomingContext(context);
      } catch (error) {
        this.loggerService.error(this.TAG, error);
      }
      await next();
    });
  };

  /**
   * Обрабатывает входящее обновление Telegram (long polling или webhook через Telegraf)
   * @param context - контекст Telegraf с сообщением или myChatMember
   * @returns Promise, завершающийся после обработки апдейта
   */
  public handleIncomingContext = async (context: Context): Promise<void> => {
    const message = context.message as Message.TextMessage | undefined;
    const telegramChatId = message?.from?.id?.toString();

    if (_.isNil(telegramChatId)) {
      return;
    }

    const rawText = message?.text?.trim() ?? '';
    const startMatch = START_COMMAND_PATTERN.exec(rawText);

    if (!_.isNil(startMatch)) {
      const deepLinkPayload = startMatch[1];

      if (_.isNil(deepLinkPayload) || deepLinkPayload === '') {
        await this.sendStartWithoutPayloadWelcome(telegramChatId);
        return;
      }

      await this.bindUserTelegramFromLinkToken(telegramChatId, message?.from?.username, deepLinkPayload);
      return;
    }

    if (context.myChatMember?.new_chat_member?.status === 'kicked') {
      const blockedTelegramId = context.myChatMember.chat.id.toString();
      this.loggerService.info(this.TAG, `User has blocked a bot. Deleting telegramID: ${blockedTelegramId}`);

      await UserEntity.update({ telegramId: blockedTelegramId }, { telegramId: null, telegramUsername: null });
    }
  };

  /**
   * Привязывает Telegram к пользователю сайта по одноразовому токену из Redis
   * @param telegramChatId - id чата Telegram (строка)
   * @param telegramUsername - username отправителя или undefined
   * @param linkToken - токен из параметра deep link `start`
   */
  private bindUserTelegramFromLinkToken = async (
    telegramChatId: string,
    telegramUsername: string | undefined,
    linkToken: string,
  ): Promise<void> => {
    if (!/^[\dA-Za-z_-]+$/.test(linkToken) || linkToken.length > 64) {
      await this.sendMessage(
        'Ссылка привязки недействительна. Создайте новую ссылку в личном кабинете на сайте.',
        telegramChatId,
      );
      return;
    }

    const redisKey = `${TELEGRAM_LINK_TOKEN_PREFIX}${linkToken}`;
    const payload = await this.redisService.get<TelegramLinkTokenRedisValue>(redisKey);

    if (_.isNil(payload) || _.isNil(payload.userId)) {
      this.loggerService.info(this.TAG, `bindUserTelegramFromLinkToken: missing or expired token for chat ${telegramChatId}`);
      await this.sendMessage(
        'Ссылка привязки устарела или уже использована. Откройте сайт и нажмите «Привязать Telegram» ещё раз.',
        telegramChatId,
      );
      return;
    }

    const user = await UserEntity.findOne({ where: { id: payload.userId } });

    if (_.isNil(user)) {
      this.loggerService.warn(this.TAG, `bindUserTelegramFromLinkToken: user ${payload.userId} not found`);
      await this.redisService.delete(redisKey);
      await this.sendMessage('Пользователь не найден. Обратитесь в поддержку.', telegramChatId);
      return;
    }

    if (!_.isEmpty(user.telegramId) && user.telegramId !== telegramChatId) {
      await this.redisService.delete(redisKey);
      await this.sendMessage(
        user.lang === UserLangEnum.RU
          ? 'Этот аккаунт на сайте уже привязан к другому Telegram. Отвяжите его в профиле на сайте.'
          : 'This site account is already linked to another Telegram. Unlink it in your profile on the website.',
        telegramChatId,
      );
      return;
    }

    if (user.telegramId === telegramChatId) {
      await this.redisService.delete(redisKey);
      await this.sendMessage(
        user.lang === UserLangEnum.RU
          ? 'Telegram уже был привязан к этому аккаунту.'
          : 'Telegram was already linked to this account.',
        telegramChatId,
      );
      return;
    }

    await UserEntity.update(user.id, {
      telegramId: telegramChatId,
      telegramUsername: telegramUsername ?? null,
    });
    await this.redisService.delete(redisKey);

    await this.sendMessage(
      user.lang === UserLangEnum.RU
        ? 'Вы успешно подписались на уведомления.\nОткройте мини-приложение <b>«Мои заказы»</b> через меню бота.'
        : 'You have successfully subscribed to notifications.\nOpen the <b>«My orders»</b> mini app from the bot menu.',
      telegramChatId,
    );
  };

  /**
   * Отправляет приветствие без deep link: инструкция по привязке или кратко про заказы/оценки, если Telegram уже привязан к аккаунту
   * @param telegramChatId - id чата Telegram
   */
  private sendStartWithoutPayloadWelcome = async (telegramChatId: string): Promise<void> => {
    const linkedUser = await UserEntity.findOne({
      select: ['id', 'lang'],
      where: { telegramId: telegramChatId },
    });

    const publicOrigin = resolveTelegramWebAppPublicOrigin();
    const ordersPath = routes.page.telegram.orders;
    const miniAppUrl = !_.isEmpty(publicOrigin) ? `${publicOrigin}${ordersPath}` : '';

    const replyMarkupForMiniApp = (buttonText: string) => (miniAppUrl
      ? {
        inline_keyboard: [
          [{ text: buttonText, web_app: { url: miniAppUrl } }],
        ],
      }
      : undefined);

    if (!_.isNil(linkedUser)) {
      const isEnglish = linkedUser.lang === UserLangEnum.EN;
      const textLines = isEnglish
        ? [
          'Your account is already linked to Telegram.',
          '',
          'In the <b>«My orders»</b> mini app you can track order statuses, pay when needed, and rate items from completed purchases.',
          '',
          ...(miniAppUrl
            ? ['Open the mini app with the button below.']
            : ['Use the bot «Menu» button to open the mini app once the app URL is configured.']),
        ]
        : [
          'Ваш аккаунт уже привязан к Telegram.',
          '',
          'В мини-приложении <b>«Мои заказы»</b> вы можете следить за статусами заказов, при необходимости оплачивать их и оценивать товары из завершённых покупок.',
          '',
          ...(miniAppUrl
            ? ['Откройте мини-приложение кнопкой ниже.']
            : ['Используйте кнопку <b>«Меню»</b> у бота, чтобы открыть мини-приложение, когда адрес приложения настроен на сервере.']),
        ];

      const replyMarkup = replyMarkupForMiniApp(isEnglish ? 'My orders' : 'Мои заказы');

      await this.sendMessage(textLines, telegramChatId, replyMarkup ? { reply_markup: replyMarkup } : undefined);
      return;
    }

    const profileUrl = !_.isEmpty(publicOrigin) ? `${publicOrigin}${routes.page.profile.personalData}` : '';
    const stepLoginWithProfileLink = !_.isEmpty(profileUrl)
      ? `1) Войдите на сайт в <a href="${profileUrl}">личный кабинет</a>.`
      : '1) Войдите на сайт в личный кабинет.';

    const textLines = [
      'Чтобы получать уведомления и открывать заказы в Telegram, привяжите аккаунт:',
      stepLoginWithProfileLink,
      '2) Нажмите «Привязать Telegram» — откроется ссылка с подтверждением.',
      '',
      ...(miniAppUrl
        ? ['После привязки откройте мини-приложение кнопкой ниже.']
        : ['После привязки используйте кнопку <b>«Меню»</b> у бота (Mini App), когда адрес приложения будет настроен на сервере.']),
    ];

    const replyMarkup = replyMarkupForMiniApp('Мои заказы');

    await this.sendMessage(textLines, telegramChatId, replyMarkup ? { reply_markup: replyMarkup } : undefined);
  };

  /**
   * Отправляет напоминание об оценке товаров по завершённому заказу с кнопкой Mini App на карточку заказа
   * @param orderId - номер заказа для текста и пути в Web App
   * @param telegramChatId - идентификатор чата Telegram получателя
   * @param userLang - язык пользователя для текста кнопки и сообщения
   * @returns результат `sendMessage` при успешной доставке в Telegram (есть `message_id`), иначе `undefined`
   */
  public sendCompletedOrderRatingReminder = async (
    orderId: number,
    telegramChatId: string,
    userLang: UserLangEnum,
  ) => {
    const publicOrigin = resolveTelegramWebAppPublicOrigin();
    const orderPath = routes.page.telegram.order(orderId);
    const miniAppOrderUrl = !_.isEmpty(publicOrigin) ? `${publicOrigin}${orderPath}` : '';

    const trimmedServerHost = (serverHost ?? '').trim().replace(/\/$/, '');
    const siteOrigin = !_.isEmpty(trimmedServerHost) ? trimmedServerHost : publicOrigin;
    const userOrderOnWebsiteUrl = !_.isEmpty(siteOrigin)
      ? `${siteOrigin}${routes.page.profile.orderHistory}/${orderId}`
      : '';

    const orderOnWebsiteLineRu = _.isEmpty(userOrderOnWebsiteUrl)
      ? 'Для этого можно нажать кнопку ниже или оставить отзыв в личном кабинете на сайте.'
      : `Для этого можно нажать кнопку ниже и откроется Ваш заказ, там можно поставить оценки. Либо можно оставить отзыв в личном кабинете <a href="${userOrderOnWebsiteUrl}">на сайте</a>.`;

    const orderOnWebsiteLineEn = _.isEmpty(userOrderOnWebsiteUrl)
      ? 'You can tap the button below or leave a review in your account on the website.'
      : `You can tap the button below to open your order and add ratings. Or you can leave a review in your account <a href="${userOrderOnWebsiteUrl}">on the website</a>.`;

    const isEnglish = userLang === UserLangEnum.EN;
    const buttonText = isEnglish ? 'Rate items' : 'Оценить товары';
    const textLines = isEnglish
      ? [
        'Hello, this is Maria from <b>AM-Chokers</b>.',
        '',
        'Thank you for your order! I hope you love your new jewelry and enjoy wearing it.',
        'If you have a moment, I would love to hear your impressions — I would really appreciate it! :)',
        '',
        ...(miniAppOrderUrl
          ? [orderOnWebsiteLineEn]
          : ['For that, you can tap <b>«My orders»</b> in the bot (Mini App) once the app URL is configured on the server.']),
        '',
        'Thank you!',
      ]
      : [
        'Здравствуйте, это Мария из <b>AM-Chokers</b>.',
        '',
        'Спасибо за заказ! Надеюсь, вам понравились новые украшения и вы с удовольствием их носите.',
        'Если найдётся минутка, расскажите о ваших впечатлениях — буду Вам признательна! :)',
        '',
        ...(miniAppOrderUrl
          ? [orderOnWebsiteLineRu]
          : ['Для этого можно нажать кнопку <b>«Мои заказы»</b> у бота (Mini App), когда адрес приложения будет настроен на сервере.']),
        '',
        'Спасибо!',
      ];

    const replyMarkup = miniAppOrderUrl
      ? {
        inline_keyboard: [
          [{ text: buttonText, web_app: { url: miniAppOrderUrl } }],
        ],
      }
      : undefined;

    return this.sendMessage(textLines, telegramChatId, replyMarkup ? { reply_markup: replyMarkup } : undefined);
  };

  public sendMessage = async (message: string | string[], telegramId: string, options?: ExtraReplyMessage) => {
    const text = this.serializeText(message);

    const { message: messageHistory } = await this.messageService.createOne({ text, type: MessageTypeEnum.TELEGRAM, telegramId });

    const result = await this.telegramBotService.sendMessage(text, telegramId, options);
    if (result?.message_id) {
      this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
      messageHistory.send = true;
      messageHistory.messageId = result.message_id.toString();
      await messageHistory.save();
      return { ...result, text, history: messageHistory };
    }
  };

  public sendMessageWithPhotos = async (message: string | string[], images: string[], telegramId: string, item: ItemEntity | null = null, options?: ExtraReplyMessage) => {
    const text = this.serializeText(message);

    const media: (InputMediaPhoto | InputMediaVideo)[] = images.map((image, index) => ({
      type: image.endsWith('.mp4') ? 'video' : 'photo',
      media: image,
      ...(!index ? { caption: text, parse_mode: 'HTML' } : {}),
    }));

    const { message: messageHistory } = await this.messageService.createOne({ text, mediaFiles: media, type: MessageTypeEnum.TELEGRAM, telegramId });

    try {
      const result = await this.telegramBotService.sendMediaGroup(media, telegramId, options);

      if (result?.length && result.every(({ message_id }) => message_id)) {
        this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
        messageHistory.send = true;
        messageHistory.messageId = result.map(({ message_id }) => message_id.toString()).join(', ').trim();
        await messageHistory.save();
        if (item) {
          await ItemEntity.update(item.id, { message: messageHistory });
          item.message = messageHistory;

          if (item.deferredPublication) {
            await DeferredPublicationEntity.softRemove(item.deferredPublication);
            item.deferredPublication.deleted = new Date();
          }
          await this.redisService.updateItemById(RedisKeyEnum.ITEM_BY_ID, item);
        }
        return { ...result, text, history: messageHistory };
      }
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, error);
      throw error;
    }
  };

  public sendAdminMessages = async (messageRu: string | string[], messageEn: string | string[], options?: ExtraReplyMessage) => {
    for (const tgId of [process.env.TELEGRAM_CHAT_ID, process.env.TELEGRAM_CHAT_ID2].filter(Boolean)) {
      const adminUser = await UserEntity.findOne({ select: ['id', 'lang', 'telegramId'], where: { telegramId: tgId } });

      if (!adminUser?.telegramId) {
        continue;
      }

      const message = adminUser.lang === UserLangEnum.RU ? messageRu : messageEn;

      await this.sendMessage(message, adminUser.telegramId, options);
    }
  };

  private serializeText = (message: string | string[]) => (Array.isArray(message) ? message.reduce((acc, field) => acc + `${field}\n`, '') : message);
}
