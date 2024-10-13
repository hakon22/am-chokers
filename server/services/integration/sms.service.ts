import axios from 'axios';
import qs from 'qs';
import passGen from 'generate-password';
import { getDigitalCode } from 'node-verification-code';
import { Singleton } from 'typescript-ioc';

export const codeGen = () => getDigitalCode(4).toString();

@Singleton
export class SmsService {
  public sendCode = async (phone: string): Promise<{ request_id: string, code: string }> => {
    try {
      const code = codeGen();

      if (process.env.NODE_ENV === 'production') {
        const object = { to: phone, txt: `Ваш код подтверждения: ${code}` };

        const { data } = await axios.post('https://api3.greensms.ru/sms/send', object, {
          headers: { Authorization: `Bearer ${process.env.SMS_API_KEY}` },
        });

        if (data.request_id) {
          return { ...data, code };
        }

        throw Error(data.error);
      } else {
        const data = { request_id: Date.now().toString(), error: 'null' };
        console.log(code);
        return { ...data, code };
      }
    } catch (e) {
      console.error(e);
      throw Error('Произошла ошибка при отправке SMS');
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

      if (process.env.NODE_ENV === 'production') {
        await axios.post('https://ssl.bs00.ru', qs.stringify(object));
      } else {
        console.log(password);
      }
      return password;
    } catch (e) {
      console.error(e);
      throw Error('Произошла ошибка при отправке SMS');
    }
  };
}
