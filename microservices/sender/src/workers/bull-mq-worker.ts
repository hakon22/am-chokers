import { Worker, type Job } from 'bullmq';
import { Container } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { CDEKService } from '@server/services/delivery/cdek.service';
import { NpdNalogService } from '@server/services/integration/npd-nalog.service';
import { SmsService, type SmsCodeParameterInterface, type SmsPasswordParameterInterface, type SmsReceiptParameterInterface } from '@server/services/integration/sms.service';
import { redisConfig } from '@server/db/database.service';
import { BullMQQueuesEnum } from '@microservices/sender/enums/bull-mq-queues.enum';
import type { TelegramJobInterface, TelegramAdminJobInterface } from '@microservices/sender/types/telegram-job.interface';
import type { OrderEntity } from '@server/db/entities/order.entity';
import type { NpdNalogOrderInterface } from '@server/types/integration/npd-nalog/npd-nalog-order.interface';

type JobInterface = TelegramJobInterface &
  TelegramAdminJobInterface &
  SmsCodeParameterInterface &
  SmsPasswordParameterInterface &
  SmsReceiptParameterInterface &
  OrderEntity &
  NpdNalogOrderInterface;

interface WorkerConfigInterface {
  queue: BullMQQueuesEnum;
  processor: (job: Job<JobInterface, any, string>) => Promise<void>;
  name: string;
}

export class BullMQWorker {
  private TAG = 'BullMQWorker';

  private readonly loggerService = Container.get(LoggerService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly smsService = Container.get(SmsService);

  private readonly CDEKService = Container.get(CDEKService);

  private readonly npdNalogService = Container.get(NpdNalogService);

  private workers: Map<BullMQQueuesEnum, Worker> = new Map();

  public init = () => {
    const options = { connection: redisConfig, concurrency: 1 };

    const workerConfigs: WorkerConfigInterface[] = [
      { queue: BullMQQueuesEnum.SMS_CODE_QUEUE, processor: this.processSMSCodeJob, name: 'SMS code' },
      { queue: BullMQQueuesEnum.SMS_PASSWORD_QUEUE, processor: this.processSMSPasswordJob, name: 'SMS password' },
      { queue: BullMQQueuesEnum.SMS_RECEIPT_QUEUE, processor: this.processSMSReceiptJob, name: 'SMS receipt' },
      { queue: BullMQQueuesEnum.TELEGRAM_QUEUE, processor: this.processTelegramJob, name: 'Telegram' },
      { queue: BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE, processor: this.processTelegramAdminJob, name: 'Telegram admin' },
      { queue: BullMQQueuesEnum.CDEK_DELIVERY_QUEUE, processor: this.processCDEKDeliveryJob, name: 'CDEK delivery' },
      { queue: BullMQQueuesEnum.NPD_NALOG_QUEUE, processor: this.processNPDNalogCreateOrderJob, name: 'NPD Nalog' },
    ];

    workerConfigs.forEach((config) => {
      const worker = new Worker(config.queue, config.processor, options);
      this.workers.set(config.queue, worker);
      this.setupEventHandlers(worker, config.name);
    });
  };

  public close = async () => {
    this.loggerService.info(this.TAG, 'Завершение работы воркеров...');
    
    await Promise.all([...this.workers.values()].map(worker => worker.close()));
    
    this.loggerService.info(this.TAG, 'Все воркеры остановлены');
  };

  private processSMSCodeJob = async (job: Job<SmsCodeParameterInterface>) => this.processSMSJob(job, 'sendCode');

  private processSMSPasswordJob = async (job: Job<SmsPasswordParameterInterface>) => this.processSMSJob(job, 'sendPass');

  private processSMSReceiptJob = async (job: Job<SmsReceiptParameterInterface>) => this.processSMSJob(job, 'sendReceipt');

  private processSMSJob = async (job: Job<SmsCodeParameterInterface | SmsPasswordParameterInterface | SmsReceiptParameterInterface>, method: 'sendCode' | 'sendPass' | 'sendReceipt') => {
    const name = 'SMS';
    try {
      this.loggerService.info(this.TAG, `Обработка ${name} задачи #${job.id}`, job.data);

      const { phone, lang } = job.data;

      if (method === 'sendCode') {
        const { code } = job.data as SmsCodeParameterInterface;
        await this.smsService.sendCode(phone, code, lang);
      } else if (method === 'sendPass') {
        const { password } = job.data as SmsPasswordParameterInterface;
        await this.smsService.sendPass(phone, password, lang);
      } else {
        const { receipt } = job.data as SmsReceiptParameterInterface;
        await this.smsService.sendReceipt(phone, receipt, lang);
      }
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке ${name} задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processTelegramJob = async (job: Job<TelegramJobInterface>) => {
    const name = 'Telegram';
    try {
      this.loggerService.info(`Обработка ${name} задачи #${job.id}`, job.data);

      const { message, telegramId, images, options, item } = job.data;

      if (images) {
        await this.telegramService.sendMessageWithPhotos(message, images, telegramId, item, options);
      } else {
        await this.telegramService.sendMessage(message, telegramId, options);
      }
      this.loggerService.info(this.TAG, `${name} сообщение отправлено успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке ${name} задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processTelegramAdminJob = async (job: Job<TelegramAdminJobInterface>) => {
    const name = 'Telegram';
    try {
      this.loggerService.info(`Обработка ${name} задачи #${job.id}`, job.data);

      const { messageRu, messageEn, options } = job.data;

      await this.telegramService.sendAdminMessages(messageRu, messageEn, options);

      this.loggerService.info(this.TAG, `${name} сообщение отправлено успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке ${name} задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processCDEKDeliveryJob = async (job: Job<OrderEntity>) => {
    const name = 'CDEK';
    try {
      this.loggerService.info(`Обработка ${name} задачи #${job.id}`, job.data);

      await this.CDEKService.createOrder(job.data);

      this.loggerService.info(this.TAG, `${name} задача завершена успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке ${name} задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processNPDNalogCreateOrderJob = async (job: Job<NpdNalogOrderInterface>) => {
    const name = 'NPD Nalog';
    try {
      this.loggerService.info(`Обработка ${name} задачи #${job.id}`, job.data);

      await this.npdNalogService.addIncome(job.data);

      this.loggerService.info(this.TAG, `${name} задача завершена успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке ${name} задачи #${job.id}:`, error);
      throw error;
    }
  };

  private setupEventHandlers = (worker: Worker, workerName: string) => {
    worker.on('completed', (job: Job) => {
      this.loggerService.info(this.TAG, `${workerName} задача #${job.id} завершена`);
    });
    worker.on('failed', (job: Job | undefined, error: Error) => {
      this.loggerService.error(this.TAG, `${workerName} задача #${job?.id} завершилась ошибкой:`, error);
    });
    worker.on('error', (error: Error) => {
      this.loggerService.error(this.TAG, `Ошибка в ${workerName} worker:`, error);
    });
  };
}
