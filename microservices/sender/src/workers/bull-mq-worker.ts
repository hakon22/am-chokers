import { Worker, type Job } from 'bullmq';
import { Container } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { SmsService, type SmsCodeParameterInterface, type SmsPasswordParameterInterface } from '@server/services/integration/sms.service';
import { redisConfig } from '@server/db/database.service';
import { BullMQQueuesEnum } from '@microservices/sender/enums/bull-mq-queues.enum';
import type { TelegramJobInterface, TelegramAdminJobInterface } from '@microservices/sender/types/telegram-job.interface';

type JobInterface = TelegramJobInterface & TelegramAdminJobInterface & SmsCodeParameterInterface & SmsPasswordParameterInterface;

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

  private workers: Map<BullMQQueuesEnum, Worker> = new Map();

  public init = () => {
    const options = { connection: redisConfig, concurrency: 1 };

    const workerConfigs: WorkerConfigInterface[] = [
      { queue: BullMQQueuesEnum.SMS_CODE_QUEUE, processor: this.processSMSCodeJob, name: 'SMS code' },
      { queue: BullMQQueuesEnum.SMS_PASSWORD_QUEUE, processor: this.processSMSPasswordJob, name: 'SMS password' },
      { queue: BullMQQueuesEnum.TELEGRAM_QUEUE, processor: this.processTelegramJob, name: 'Telegram' },
      { queue: BullMQQueuesEnum.TELEGRAM_ADMIN_QUEUE, processor: this.processTelegramAdminJob, name: 'Telegram admin' },
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

  private processSMSJob = async (job: Job<SmsCodeParameterInterface | SmsPasswordParameterInterface>, method: 'sendCode' | 'sendPass') => {
    try {
      this.loggerService.info(this.TAG, `Обработка SMS задачи #${job.id}`, job.data);

      const { phone, lang } = job.data;

      if (method === 'sendCode') {
        const { code } = job.data as SmsCodeParameterInterface;
        await this.smsService.sendCode(phone, code, lang);
      } else {
        const { password } = job.data as SmsPasswordParameterInterface;
        await this.smsService.sendPass(phone, password, lang);
      }
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке SMS задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processTelegramJob = async (job: Job<TelegramJobInterface>) => {
    try {
      this.loggerService.info(`Обработка Telegram задачи #${job.id}`, job.data);

      const { message, telegramId, images, options, item } = job.data;

      if (images) {
        await this.telegramService.sendMessageWithPhotos(message, images, telegramId, item, options);
      } else {
        await this.telegramService.sendMessage(message, telegramId, options);
      }
      this.loggerService.info(this.TAG, `Telegram сообщение отправлено успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке Telegram задачи #${job.id}:`, error);
      throw error;
    }
  };

  private processTelegramAdminJob = async (job: Job<TelegramAdminJobInterface>) => {
    try {
      this.loggerService.info(`Обработка Telegram задачи #${job.id}`, job.data);

      const { messageRu, messageEn, options } = job.data;

      await this.telegramService.sendAdminMessages(messageRu, messageEn, options);

      this.loggerService.info(this.TAG, `Telegram сообщение отправлено успешно: #${job.id}`);
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке Telegram задачи #${job.id}:`, error);
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
