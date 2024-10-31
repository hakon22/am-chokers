import type { Request, Response } from 'express';
import axios from 'axios';
import { Container, Singleton } from 'typescript-ioc';
import { Context } from 'telegraf';
import { Message } from 'typegram/message';

import { UserEntity } from '@server/db/entities/user.entity';
import { LoggerService } from '@server/services/app/logger.service';
import { phoneTransform } from '@server/utilities/phone.transform';

@Singleton
export class TelegramService {
  private readonly loggerService = Container.get(LoggerService);

  public webhooks = async (req: Request, res: Response) => {
    try {
      const context = req.body as Context;
      const message = context.message as Message.ContactMessage & Message.TextMessage;

      if (message?.text === '/start') {
        await this.start(message?.from?.id?.toString() as string);
      } else if (message?.contact?.phone_number) {
        const user = await UserEntity.findOne({ where: { phone: phoneTransform(message.contact.phone_number) } });
        if (user) {
          await UserEntity.update(user.id, { telegramId: message?.from?.id?.toString() });
          await this.sendMessage('Вы успешно подписались на обновления.', message?.from?.id?.toString() as string);
        } else {
          await this.sendMessage('Номер телефона не найден в базе данных.', message?.from?.id?.toString() as string);
        }
      } else if (context.myChatMember?.new_chat_member?.status === 'kicked') {
        const telegramId = context.myChatMember.chat.id.toString();
        this.loggerService.info('[TelegramBotService]', `User has blocked a bot. Deleting telegramID: ${telegramId}`);

        await UserEntity.update({ telegramId }, { telegramId: undefined });
      }
      res.end();
    } catch (e) {
      this.loggerService.error(e);
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

    const { data } = await axios.post<{ ok: boolean }>(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      parse_mode: 'html',
      text,
      ...options,
    });
    if (data?.ok) {
      this.loggerService.info('Сообщение в Telegram отправлено!');
    } else {
      this.loggerService.error('Ошибка отправки сообщения в Telegram :(');
    }
  };
}
