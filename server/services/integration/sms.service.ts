import crypto from 'crypto';

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

export interface SmsReceiptParameterInterface extends SmsParameterInterface {
  receipt: string;
}

interface MainSmsRequestInterface {
  [key: string]: string | string[] | 1 | 0 | undefined;
  test?: 1 | 0;
  sender?: string;
  project: string;
  recipients: string | string[];
  message: string;
}

interface MainSmsResponseInterface {
  status?: 'success' | 'error';
  recipients?: string[];
  parts?: number;
  count?: number;
  price?: string;
  balance?: string;
  messages_id?: number[];
  test?: 0 | 1;
  error?: number;
  message?: string;
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
          headers: { Authorization: `Bearer ${process.env.SMS_PROSTO_API_KEY}` },
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

  public sendReceipt = async (phone: string, receipt: string, lang: UserLangEnum): Promise<MainSmsResponseInterface & { receipt: string }> => {
    try {
      const text = `Receipt: ${receipt}`;

      const { message } = await this.messageService.createOne({ text, type: MessageTypeEnum.SMS, phone });

      if (process.env.NODE_ENV === 'production') {
        this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);

        const { data } = await axios.get<MainSmsResponseInterface>(`https://mainsms.ru/api/message/send?${this.getMainSmsUrlParams({ message: text, recipients: phone, project: 'am_chokers' })}`);

        if (data?.messages_id?.length) {
          message.send = true;
          await message.save();
          return { ...data, receipt };
        }

        throw new Error(data.message);
      } else {
        const data = { message_id: [Date.now()] };
        console.log(text);
        return { ...data, receipt };
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
        key: process.env.GREEN_SMS_API_KEY,
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

  private getMainSmsUrlParams = (options: MainSmsRequestInterface) => {
    let signature = '';
    let params = '';
    const keys = Object.keys(options).sort();

    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const value = options[key];

      if (value || value === '' || value === 0) {
        signature += value + ';';
        if (key === 'message') {
          params += key + '=' + encodeURIComponent(typeof value !== 'string' ? value.toString() : value) + '&';
        } else {
          params += key + '=' + value + '&';
        }
      }
    }

    signature += process.env.MAIN_SMS_API_KEY;
    signature = crypto.createHash('sha1').update(signature).digest('hex');
    signature = crypto.createHash('md5').update(signature).digest('hex');

    params += 'sign=' + signature;
    return params;
  };
}
