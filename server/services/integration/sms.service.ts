import axios from 'axios';
import qs from 'qs';
import { Container, Singleton } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { MessageService } from '@server/services/message/message.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';

interface SmsParameterInterface {
  phone: string;
  lang: UserLangEnum;
}

export interface SmsCodeParameterInterface extends SmsParameterInterface {
  code: string;
}

export interface SmsPasswordParameterInterface extends SmsParameterInterface {
  password: string;
}

@Singleton
export class SmsService {
  private readonly TAG = 'SMS Service';

  private readonly loggerService = Container.get(LoggerService);

  private readonly messageService = Container.get(MessageService);

  public sendCode = async (phone: string, code: string, lang: UserLangEnum): Promise<{ request_id: string, code: string }> => {
    try {
      const object = { to: phone, txt: `Ваш код подтверждения: ${code}` };

      const { message } = await this.messageService.createOne({ text: object.txt, type: MessageTypeEnum.SMS, phone });

      if (process.env.NODE_ENV === 'production') {
        this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);

        const { data } = await axios.post('https://api3.greensms.ru/sms/send', object, {
          headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}` },
        });

        if (data.request_id) {
          message.send = true;
          await message.save();
          return { ...data, code };
        }

        throw new Error(data.error);
      } else {
        const data = { request_id: Date.now().toString(), error: 'null' };
        console.log(object.txt);
        return { ...data, code };
      }
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(lang === UserLangEnum.RU
        ? 'Произошла ошибка при отправке SMS'
        : 'There was an error sending SMS');
    }
  };

  public sendPass = async (phone: string, password: string, lang: UserLangEnum): Promise<string> => {
    try {
      const object = {
        method: 'push_msg',
        format: 'json',
        key: process.env.SMS_API_KEY_PASS,
        text: `Ваш пароль для входа: ${password} ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}`,
        phone,
        sender_name: 'AM-PROJECTS',
      };

      const { message } = await this.messageService.createOne({ text: object.text, type: MessageTypeEnum.SMS, phone });

      if (process.env.NODE_ENV === 'production') {
        this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);
        await axios.post('https://ssl.bs00.ru', qs.stringify(object));
        message.send = true;
        await message.save();
      } else {
        console.log(password);
      }
      return password;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(lang === UserLangEnum.RU
        ? 'Произошла ошибка при отправке SMS'
        : 'There was an error sending SMS');
    }
  };
}
