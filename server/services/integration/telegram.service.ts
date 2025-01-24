import { createReadStream } from 'fs';

import type { Request, Response } from 'express';
import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import { Context } from 'telegraf';
import { Message } from 'typegram/message';
import FormData from 'form-data';

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
    const text = Array.isArray(message) ? message.reduce((acc, field) => acc += `${field}\n`, '') : message;

    const history = await MessageEntity.create({ text, type: MessageTypeEnum.TELEGRAM, telegramId }).save();

    const { data } = await axios.post<{ ok: boolean; message_id: number; }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      parse_mode: 'html',
      text,
      ...options,
    });
    if (data?.ok) {
      this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
      history.send = true;
      await history.save();
      return { ...data, text };
    } else {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, data);
    }
  };

  public sendMessageWithPhotos = async (message: string | string[], images: string[], telegramId: string, options?: any) => {
    const result = await this.sendMessage(message, telegramId, options);

    if (!result) {
      return;
    }

    const form = new FormData();

    form.append('chat_id', telegramId);
    form.append('parse_mode', 'HTML');
    form.append('reply_to_message_id', result.message_id);

    images.forEach((image) => {
      form.append('photo', createReadStream(image));
    });

    if (options) {
      Object.keys(options).forEach((key) => {
        form.append(key, options[key]);
      });
    }

    const formString  = new URLSearchParams();

    form.forEach((value, key) => {
      if (key && typeof value !== 'object') {
        formString .append(key as string, value);
      }
    });
    
    const text = formString .toString();

    const history = await MessageEntity.create({ text, type: MessageTypeEnum.TELEGRAM, telegramId }).save();

    const { data } = await axios.post<{ ok: boolean }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendPhoto`, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    if (data?.ok) {
      this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
      history.send = true;
      await history.save();
    } else {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, data);
    }
  };
}
