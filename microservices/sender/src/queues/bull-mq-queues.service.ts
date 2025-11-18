import { Queue } from 'bullmq';
import { Singleton } from 'typescript-ioc';

import { redisConfig } from '@server/db/database.service';
import { BullMQQueuesEnum } from '@microservices/sender/enums/bull-mq-queues.enum';
import type { SmsParameterInterface } from '@server/services/integration/sms.service';
import type { TelegramJobInterface } from '@microservices/sender/types/telegram-job.interface';

@Singleton
export class BullMQQueuesService {
  private smsCodeQueue = new Queue(BullMQQueuesEnum.SMS_CODE_QUEUE, { connection: redisConfig });

  private smsPasswordQueue = new Queue(BullMQQueuesEnum.SMS_PASSWORD_QUEUE, { connection: redisConfig });

  private telegramQueue = new Queue(BullMQQueuesEnum.TELEGRAM_QUEUE, { connection: redisConfig });

  public sendSMSCode = async (options: SmsParameterInterface) => this.smsCodeQueue.add(BullMQQueuesEnum.SMS_CODE_QUEUE, options);

  public sendSMSPassword = async (options: SmsParameterInterface) => this.smsPasswordQueue.add(BullMQQueuesEnum.SMS_PASSWORD_QUEUE, options);

  public sendTelegramMessage = async (options: TelegramJobInterface) => this.telegramQueue.add(BullMQQueuesEnum.TELEGRAM_QUEUE, options);
}
