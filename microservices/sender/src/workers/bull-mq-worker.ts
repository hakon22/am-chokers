import { Worker, type Job } from 'bullmq';
import { Container } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { SmsService, type SmsParameterInterface } from '@server/services/integration/sms.service';
import { redisConfig } from '@server/db/database.service';
import { BullMQQueuesEnum } from '@microservices/sender/enums/bull-mq-queues.enum';
import type { TelegramJobInterface } from '@microservices/sender/types/telegram-job.interface';

export class BullMQWorker {
  private TAG = 'BillMQWorker';

  private readonly loggerService = Container.get(LoggerService);

  private readonly telegramService = Container.get(TelegramService);

  private readonly smsService = Container.get(SmsService);

  private smsCodeWorker: Worker;

  private smsPasswordWorker: Worker;

  private telegramWorker: Worker;

  public init = () => {
    const options = { connection: redisConfig, concurrency: 1 };

    this.smsCodeWorker = new Worker(BullMQQueuesEnum.SMS_CODE_QUEUE, this.processSMSCodeJob, options);
    this.smsPasswordWorker = new Worker(BullMQQueuesEnum.SMS_PASSWORD_QUEUE, this.processSMSPasswordJob, options);
    this.telegramWorker = new Worker(BullMQQueuesEnum.TELEGRAM_QUEUE, this.processTelegramJob, options);

    this.setupEventHandlers();
  };

  public close = async () => {
    this.loggerService.info(this.TAG, 'Завершение работы воркеров...');
    
    await this.smsCodeWorker.close();
    await this.smsPasswordWorker.close();
    await this.telegramWorker.close();
    
    this.loggerService.info(this.TAG, 'Все воркеры остановлены');
  };

  private processSMSCodeJob = async (job: Job<SmsParameterInterface>) => {
    try {
      this.loggerService.info(this.TAG, `Обработка SMS задачи ${job.id}`, job.data);

      const { phone, lang } = job.data;

      const result = await this.smsService.sendCode(phone, lang);

      this.loggerService.info(this.TAG, `SMS отправлено успешно: ${job.id}`);
      return result;
      
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке SMS задачи ${job.id}:`, error);
      throw error;
    }
  };

  private processSMSPasswordJob = async (job: Job<SmsParameterInterface>) => {
    try {
      this.loggerService.info(this.TAG, `Обработка SMS задачи ${job.id}`, job.data);

      const { phone, lang } = job.data;

      const result = await this.smsService.sendPass(phone, lang);

      this.loggerService.info(this.TAG, `SMS отправлено успешно: ${job.id}`);
      return result;
      
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке SMS задачи ${job.id}:`, error);
      throw error;
    }
  };

  private processTelegramJob = async (job: Job<TelegramJobInterface>) => {
    try {
      this.loggerService.info(`Обработка Telegram задачи ${job.id}`, job.data);

      const { message, telegramId, images, options } = job.data;

      const result = images
        ? await this.telegramService.sendMessageWithPhotos(message, images, telegramId, options)
        : await this.telegramService.sendMessage(message, telegramId, options);

      this.loggerService.info(this.TAG, `Telegram сообщение отправлено успешно: ${job.id}`);
      return result;
    } catch (error) {
      this.loggerService.error(this.TAG, `Ошибка при обработке Telegram задачи ${job.id}:`, error);
      throw error;
    }
  };

  private setupEventHandlers = () => {
    this.smsCodeWorker.on('completed', (job: Job) => {
      this.loggerService.info(this.TAG, `SMS задача ${job.id} завершена`);
    });

    this.smsCodeWorker.on('failed', (job: Job | undefined, error: Error) => {
      this.loggerService.error(this.TAG, `SMS задача ${job?.id} завершилась ошибкой:`, error);
    });

    this.smsCodeWorker.on('error', (error: Error) => {
      this.loggerService.error(this.TAG, 'Ошибка в SMS code worker:', error);
    });

    this.smsPasswordWorker.on('completed', (job: Job) => {
      this.loggerService.info(this.TAG, `SMS задача ${job.id} завершена`);
    });

    this.smsPasswordWorker.on('failed', (job: Job | undefined, error: Error) => {
      this.loggerService.error(this.TAG, `SMS задача ${job?.id} завершилась ошибкой:`, error);
    });

    this.smsPasswordWorker.on('error', (error: Error) => {
      this.loggerService.error(this.TAG, 'Ошибка в SMS password worker:', error);
    });

    this.telegramWorker.on('completed', (job: Job) => {
      this.loggerService.info(this.TAG, `Telegram задача ${job.id} завершена`);
    });

    this.telegramWorker.on('failed', (job: Job | undefined, error: Error) => {
      this.loggerService.error(this.TAG, `Telegram задача ${job?.id} завершилась ошибкой:`, error);
    });

    this.telegramWorker.on('error', (error: Error) => {
      this.loggerService.error(this.TAG, 'Ошибка в Telegram worker:', error);
    });
  };
}
