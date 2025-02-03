import type { Request, Response } from 'express';
import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import { Context } from 'telegraf';
import { Message } from 'typegram/message';
import type { InputMediaPhoto } from 'telegraf/typings/core/types/typegram';

import { UserEntity } from '@server/db/entities/user.entity';
import { MessageEntity } from '@server/db/entities/message.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { phoneTransform } from '@server/utilities/phone.transform';
import { MessageTypeEnum } from '@server/types/integration/enums/message.type.enum';

@Singleton
export class TelegramService {
  private TAG = 'TelegramBotService';

  private readonly loggerService = Container.get(LoggerService);

  public webhooks = async (req: Request, res: Response) => {
    try {
      const context = req.body as Context;
      const message = context.message as Message.ContactMessage & Message.TextMessage;

      const id = message?.from?.id?.toString();

      if (message?.text === '/start') {
        await this.start(id as string);
      } else if (message?.contact?.phone_number) {
        const user = await UserEntity.findOne({ where: { phone: phoneTransform(message.contact.phone_number) } });
        if (user) {
          await UserEntity.update(user.id, { telegramId: id });
          await this.sendMessage('Вы успешно подписались на уведомления.', id as string);
        } else {
          await this.sendMessage('Номер телефона не найден в базе данных.', id as string);
        }
      } else if (context.myChatMember?.new_chat_member?.status === 'kicked') {
        const telegramId = context.myChatMember.chat.id.toString();
        this.loggerService.info(this.TAG, `User has blocked a bot. Deleting telegramID: ${telegramId}`);

        await UserEntity.update({ telegramId }, { telegramId: undefined });
      }
      res.end();
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      res.sendStatus(500);
    }
  };

  public start = async (telegramId: string) => {
    const replyMarkup = {
      keyboard: [
        [
          {
            text: '📞 Отправить номер телефона',
            request_contact: true,
          },
        ],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    };
    await this.sendMessage('Пожалуйста, предоставьте ваш номер телефона:', telegramId, { reply_markup: replyMarkup });
  };

  public sendMessage = async (message: string | string[], telegramId: string, options?: object) => {
    const text = this.serializeText(message);

    const history = await MessageEntity.create({ text, type: MessageTypeEnum.TELEGRAM, telegramId }).save();

    try {
      const { data } = await axios.post<{ ok: boolean; result: { message_id: string; } }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: telegramId,
        parse_mode: 'HTML',
        text,
        ...options,
      });
      if (data?.ok) {
        this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
        history.send = true;
        history.messageId = data.result.message_id;
        await history.save();
        return { ...data, text, history };
      }
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
    }
  };

  public sendMessageWithPhotos = async (message: string | string[], images: string[], telegramId: string, options?: any) => {
    const text = this.serializeText(message);

    const media: InputMediaPhoto[] = images.map((image, i) => ({
      type: 'photo',
      media: image,
      ...(!i ? { caption: text, parse_mode: 'HTML' } : {}),
    }));

    const request = {
      chat_id: telegramId,
      media,
      ...options,
    };

    const history = await MessageEntity.create({ text, mediaFiles: media, type: MessageTypeEnum.TELEGRAM, telegramId }).save();

    try {
      const { data } = await axios.post<{ ok: boolean; result: { message_id: string; }[] }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMediaGroup`, request);

      if (data?.ok) {
        this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
        history.send = true;
        history.messageId = data.result.map(({ message_id }) => message_id).join(', ');
        await history.save();
        return { ...data, text, history };
      }
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
    }
  };

  private serializeText = (message: string | string[]) => Array.isArray(message) ? message.reduce((acc, field) => acc += `${field}\n`, '') : message;
}
