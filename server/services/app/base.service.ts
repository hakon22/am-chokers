import { Container } from 'typescript-ioc';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { LoggerService } from '@server/services/app/logger.service';

export abstract class BaseService {
  protected databaseService = Container.get(DatabaseService);

  protected redisService = Container.get(RedisService);

  protected logger = Container.get(LoggerService);
}
