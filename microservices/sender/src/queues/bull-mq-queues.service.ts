import { Queue } from 'bullmq';
import { Singleton } from 'typescript-ioc';

import { redisConfig } from '@server/db/database.service';
import { BullMQQueuesEnum } from '@microservices/sender/enums/bull-mq-queues.enum';
import type { SmsCodeParameterInterface, SmsPasswordParameterInterface } from '@server/services/integration/sms.service';
import type { TelegramJobInterface, TelegramAdminJobInterface } from '@microservices/sender/types/telegram-job.interface';
import type { OrderEntity } from '@server/db/entities/order.entity';

@Singleton
export class BullMQQueuesService {
  private readonly createQueue = (queue: BullMQQueuesEnum) => new Queue(queue, { connection: redisConfig });

  private readonly queues: Record<BullMQQueuesEnum, Queue> = {
    [BullMQQueuesEnum.SMS_CODE_QUEUE]: this.createQueue(BullMQQueuesEnum.SMS_CODE_QUEUE),
    [BullMQQueuesEnum.SMS_PASSWORD_QUEUE]: this.createQueue(BullMQQueuesEnum.SMS_PASSWORD_QUEUE),
    [BullMQQueuesEnum.TELEGRAM_QUEUE]: this.createQueue(BullMQQueuesEnum.TELEGRAM_QUEUE),
    [BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE]: this.createQueue(BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE),
    [BullMQQueuesEnum.CDEK_DELIVERY_QUEUE]: this.createQueue(BullMQQueuesEnum.CDEK_DELIVERY_QUEUE),
  };

  public sendSMSCode = (data: SmsCodeParameterInterface) => this.queues[BullMQQueuesEnum.SMS_CODE_QUEUE].add(BullMQQueuesEnum.SMS_CODE_QUEUE, data);

  public sendSMSPassword = (data: SmsPasswordParameterInterface) => this.queues[BullMQQueuesEnum.SMS_PASSWORD_QUEUE].add(BullMQQueuesEnum.SMS_PASSWORD_QUEUE, data);

  public sendTelegramMessage = (data: TelegramJobInterface) => this.queues[BullMQQueuesEnum.TELEGRAM_QUEUE].add(BullMQQueuesEnum.TELEGRAM_QUEUE, data);

  public sendTelegramAdminMessage = (data: TelegramAdminJobInterface) => this.queues[BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE].add(BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE, data);

  public CDEKDeliveryHandler = (data: OrderEntity) => this.queues[BullMQQueuesEnum.CDEK_DELIVERY_QUEUE].add(BullMQQueuesEnum.CDEK_DELIVERY_QUEUE, data);
}
