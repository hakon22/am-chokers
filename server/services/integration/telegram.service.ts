import type { Request, Response } from 'express';
import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import { Context } from 'telegraf';
import { Message } from 'typegram/message';
import type { InputMedia } from 'telegraf/typings/core/types/typegram';

import { UserEntity } from '@server/db/entities/user.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { MessageService } from '@server/services/message/message.service';
import { phoneTransform } from '@server/utilities/phone.transform';
import { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';

interface OptionsTelegramMessageInterface {
  reply_markup?: {
    keyboard: {
      text: string;
      request_contact?: boolean;
    }[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  },
  caption?: string;
  parse_mode?: 'HTML' | 'Markdown';
}

@Singleton
export class TelegramService {
  private TAG = 'TelegramBotService';

  private readonly loggerService = Container.get(LoggerService);

  private readonly messageService = Container.get(MessageService);

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
          await this.sendMessage('Вы успешно подписались на уведомления.', id as string, { reply_markup: { keyboard: [], remove_keyboard: true } });
        } else {
          await this.sendMessage('Номер телефона не найден в базе данных.', id as string);
        }
      } else if (context.myChatMember?.new_chat_member?.status === 'kicked') {
        const telegramId = context.myChatMember.chat.id.toString();
        this.loggerService.info(this.TAG, `User has blocked a bot. Deleting telegramID: ${telegramId}`);

        await UserEntity.update({ telegramId }, { telegramId: null });
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
    await this.sendMessage('Пожалуйста, предоставьте ваш номер телефона через кнопку ниже:', telegramId, { reply_markup: replyMarkup });
  };

  public sendMessage = async (message: string | string[], telegramId: string, options?: OptionsTelegramMessageInterface) => {
    const text = this.serializeText(message);

    const { message: messageHistory } = await this.messageService.createOne({ text, type: MessageTypeEnum.TELEGRAM, telegramId });

    try {
      const { data } = await axios.post<{ ok: boolean; result: { message_id: string; } }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: telegramId,
        parse_mode: 'HTML',
        text,
        ...options,
      });
      if (data?.ok) {
        this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
        messageHistory.send = true;
        messageHistory.messageId = data.result.message_id;
        await messageHistory.save();
        return { ...data, text, history: messageHistory };
      }
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
    }
  };

  public sendMessageWithPhotos = async (message: string | string[], images: string[], telegramId: string, options?: OptionsTelegramMessageInterface) => {
    const text = this.serializeText(message);

    const media: InputMedia[] = images.map((image, i) => ({
      type: image.endsWith('.mp4') ? 'video' : 'photo',
      media: image,
      ...(!i ? { caption: text, parse_mode: 'HTML' } : {}),
    }));

    const request = {
      chat_id: telegramId,
      media,
      ...options,
    };

    const { message: messageHistory } = await this.messageService.createOne({ text, mediaFiles: media, type: MessageTypeEnum.TELEGRAM, telegramId });

    try {
      const { data } = await axios.post<{ ok: boolean; result: { message_id: string; }[] }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMediaGroup`, request);

      if (data?.ok) {
        this.loggerService.info(this.TAG, `Сообщение в Telegram на telegramId ${telegramId} успешно отправлено`);
        messageHistory.send = true;
        messageHistory.messageId = data.result.map(({ message_id }) => message_id).join(', ').trim();
        await messageHistory.save();
        return { ...data, text, history: messageHistory };
      }
    } catch (e) {
      this.loggerService.error(this.TAG, `Ошибка отправки сообщения на telegramId ${telegramId} :(`, e);
    }
  };

  private serializeText = (message: string | string[]) => Array.isArray(message) ? message.reduce((acc, field) => acc += `${field}\n`, '') : message;
}
