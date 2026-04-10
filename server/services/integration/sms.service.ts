import crypto from 'crypto';

import axios from 'axios';
import qs from 'qs';
import { Container, Singleton } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { MessageService } from '@server/services/message/message.service';
import { SmsMessagePreset, smsPresetPrimaryProvider } from '@server/types/integration/enums/sms-message-preset.enum';
import { SmsProviderEnum } from '@server/types/integration/enums/sms-provider.enum';
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

/** Маршрут: пресет (код / пароль / чек) или явный оператор для произвольного текста. */
export type SmsRouting =
  | { preset: SmsMessagePreset; }
  | { provider: SmsProviderEnum; };

export interface SmsSendSuccess {
  providerUsed: SmsProviderEnum;
  greenSms?: { request_id: string; };
  mainSms?: MainSmsResponseInterface;
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

  /**
   * Единая точка отправки: `{ preset }` или `{ provider }` для произвольного текста.
   * Пресеты → основной оператор: CONFIRMATION_CODE → GREEN_SMS, PASSWORD → SMS_PROSTO, RECEIPT → MAIN_SMS.
   * При сбое основного (кроме случая, когда основной уже MAIN_SMS) — одна повторная отправка того же текста через MAIN_SMS.
   */
  public sendSms = async (phone: string, text: string, routing: SmsRouting): Promise<SmsSendSuccess> => {
    const { message } = await this.messageService.createOne({ text, type: MessageTypeEnum.SMS, phone });

    const primary = this.resolvePrimaryProvider(routing);

    if (process.env.NODE_ENV !== 'production') {
      console.log(text);
      return { providerUsed: primary };
    }

    this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);

    const markSent = async () => {
      message.send = true;
      await message.save();
    };

    try {
      const payload = await this.dispatchToProvider(phone, text, primary);
      await markSent();
      return { ...payload, providerUsed: primary };
    } catch (primaryError) {
      this.loggerService.error(this.TAG, primaryError);

      if (primary === SmsProviderEnum.MAIN_SMS) {
        throw primaryError;
      }

      this.loggerService.warn(this.TAG, `SMS: резервный канал MAIN_SMS после сбоя ${primary}`, { phone });

      try {
        const payload = await this.dispatchToProvider(phone, text, SmsProviderEnum.MAIN_SMS);
        await markSent();
        return { ...payload, providerUsed: SmsProviderEnum.MAIN_SMS };
      } catch (fallbackError) {
        this.loggerService.error(this.TAG, 'SMS: резерв MAIN_SMS не удался', fallbackError);
        throw fallbackError;
      }
    }
  };

  public sendCode = async (phone: string, code: string, lang: UserLangEnum): Promise<{ request_id: string, code: string; }> => {
    try {
      const text = `Ваш код подтверждения: ${code}`;
      const result = await this.sendSms(phone, text, { preset: SmsMessagePreset.CONFIRMATION_CODE });

      if (process.env.NODE_ENV !== 'production') {
        const data = { request_id: Date.now().toString(), error: 'null' };
        return { ...data, code };
      }

      if (result.greenSms?.request_id) {
        return { request_id: result.greenSms.request_id, code };
      }

      if (result.mainSms?.messages_id?.length) {
        return { request_id: String(result.mainSms.messages_id[0]), code };
      }

      throw new Error('SMS: нет идентификатора отправки');
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
      const result = await this.sendSms(phone, text, { preset: SmsMessagePreset.RECEIPT });

      if (process.env.NODE_ENV !== 'production') {
        const data: MainSmsResponseInterface & { receipt: string; } = { messages_id: [Date.now()], receipt };
        return data;
      }

      if (result.mainSms) {
        return { ...result.mainSms, receipt };
      }

      throw new Error('SMS: нет ответа MainSMS');
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw new Error(lang === UserLangEnum.RU
        ? 'Произошла ошибка при отправке SMS'
        : 'There was an error sending SMS');
    }
  };

  public sendPass = async (phone: string, password: string, lang: UserLangEnum): Promise<string> => {
    try {
      const text = `Ваш пароль для входа: ${password} ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}`;
      await this.sendSms(phone, text, { preset: SmsMessagePreset.PASSWORD });

      if (process.env.NODE_ENV !== 'production') {
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

  private resolvePrimaryProvider = (routing: SmsRouting): SmsProviderEnum => {
    if ('preset' in routing) {
      return smsPresetPrimaryProvider[routing.preset];
    }
    return routing.provider;
  };

  private dispatchToProvider = async (
    phone: string,
    text: string,
    provider: SmsProviderEnum,
  ): Promise<Omit<SmsSendSuccess, 'providerUsed'>> => {
    switch (provider) {
    case SmsProviderEnum.GREEN_SMS:
      return this.sendViaGreenSms(phone, text);
    case SmsProviderEnum.MAIN_SMS:
      return this.sendViaMainSms(phone, text);
    case SmsProviderEnum.SMS_PROSTO:
      return this.sendViaSmsProsto(phone, text);
    }
  };

  private sendViaGreenSms = async (phone: string, text: string): Promise<Pick<SmsSendSuccess, 'greenSms'>> => {
    const object = { to: phone, txt: text };
    const { data } = await axios.post<{ request_id?: string; error?: string; }>('https://api3.greensms.ru/sms/send', object, {
      headers: { Authorization: `Bearer ${process.env.GREEN_SMS_API_KEY}` },
    });

    if (data.request_id) {
      return { greenSms: { request_id: data.request_id } };
    }

    throw new Error(data.error ?? 'GreenSMS');
  };

  private sendViaMainSms = async (phone: string, text: string): Promise<Pick<SmsSendSuccess, 'mainSms'>> => {
    const { data } = await axios.get<MainSmsResponseInterface>(
      `https://mainsms.ru/api/message/send?${this.getMainSmsUrlParams({ message: text, recipients: phone, project: 'am_chokers' })}`,
    );

    if (data?.messages_id?.length) {
      return { mainSms: data };
    }

    throw new Error(data?.message ?? 'MainSMS');
  };

  private sendViaSmsProsto = async (phone: string, text: string): Promise<Record<string, never>> => {
    const body = {
      method: 'push_msg',
      format: 'json',
      key: process.env.SMS_PROSTO_API_KEY,
      text,
      phone,
      sender_name: 'AM-PROJECTS',
    };

    await axios.post('https://ssl.bs00.ru', qs.stringify(body));
    return {};
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
