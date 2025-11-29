import { Container } from 'typescript-ioc';

import { LoggerService } from '@server/services/app/logger.service';
import { BullMQWorker } from '@microservices/sender/workers/bull-mq-worker';
import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';

class Sender {
  private readonly bullMQWorker = Container.get(BullMQWorker);

  private readonly loggerService = Container.get(LoggerService);

  private readonly databaseService = Container.get(DatabaseService);

  private readonly redisService = Container.get(RedisService);

  public init = async () => {
    try {
      await this.databaseService.init();
      await this.redisService.init({ withoutSubscribles: true });
      this.bullMQWorker.init();
      this.loggerService.info('Сервис BullMQ Worker успешно запущен');

      this.setupGracefulShutdown();
    } catch (error) {
      this.loggerService.error('Failed to start BullMQ Worker:', error);
      process.exit(1);
    }
  };

  private setupGracefulShutdown = () => {
    process.on('SIGTERM', this.gracefulShutdown);
    process.on('SIGINT', this.gracefulShutdown);
  };

  private gracefulShutdown = async (signal: string) => {
    this.loggerService.info(`${signal} received, shutting down gracefully`);
    
    try {
      await this.bullMQWorker.close();
      this.loggerService.info('BullMQ Worker stopped gracefully');
      process.exit(0);
    } catch (error) {
      this.loggerService.error('Error during shutdown:', error);
      process.exit(1);
    }
  };
}

const start = new Sender();

start.init();
