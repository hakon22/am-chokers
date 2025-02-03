import axios from 'axios';
import qs from 'qs';
import passGen from 'generate-password';
import { getDigitalCode } from 'node-verification-code';
import { Container, Singleton } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { MessageTypeEnum } from '@server/types/integration/enums/message.type.enum';
import { MessageEntity } from '@server/db/entities/message.entity';

@Singleton
export class SmsService {
  private TAG = 'SMS Service';

  private readonly loggerService = Container.get(LoggerService);

  public sendCode = async (phone: string): Promise<{ request_id: string, code: string }> => {
    try {
      const code = this.codeGen();
      const object = { to: phone, txt: `Ваш код подтверждения: ${code}` };

      const history = await MessageEntity.create({ text: object.txt, type: MessageTypeEnum.SMS, phone }).save();

      if (process.env.NODE_ENV === 'production') {
        this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);

        const { data } = await axios.post('https://api3.greensms.ru/sms/send', object, {
          headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}` },
        });

        if (data.request_id) {
          history.send = true;
          await history.save();
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
      throw new Error('Произошла ошибка при отправке SMS');
    }
  };

  public sendPass = async (phone: string) => {
    try {
      const password = passGen.generate({
        length: 7,
        numbers: true,
      });
      const object = {
        method: 'push_msg',
        format: 'json',
        key: process.env.SMS_API_KEY_PASS,
        text: `Ваш пароль для входа: ${password} ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}`,
        phone,
        sender_name: 'AM-PROJECTS',
      };

      const history = await MessageEntity.create({ text: object.text, type: MessageTypeEnum.SMS, phone }).save();

      if (process.env.NODE_ENV === 'production') {
        this.loggerService.info(this.TAG, `Отправка SMS по номеру телефона: ${phone}`);
        await axios.post('https://ssl.bs00.ru', qs.stringify(object));
        history.send = true;
        await history.save();
      } else {
        console.log(password);
      }
      return password;
    } catch (e) {
      this.loggerService.error(this.TAG, e);
      throw Error('Произошла ошибка при отправке SMS');
    }
  };

  private codeGen = () => getDigitalCode(4).toString();
}
