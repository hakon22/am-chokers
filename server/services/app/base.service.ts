import { Container } from 'typescript-ioc';
import type { Response } from 'express';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { LoggerService } from '@server/services/app/logger.service';

export abstract class BaseService {
  protected databaseService = Container.get(DatabaseService);

  protected redisService = Container.get(RedisService);

  protected loggerService = Container.get(LoggerService);

  protected errorHandler = (e: any, res: Response) => {
    this.loggerService.error(e);
    res.status(500).json({ error: `${e?.name}: ${e?.message}` });
  };
}
