import { Container } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { LoggerService } from '@server/services/app/logger.service';
import { TokenService } from '@server/services/user/token.service';

export abstract class BaseService {
  protected databaseService = Container.get(DatabaseService);

  protected redisService = Container.get(RedisService);

  protected loggerService = Container.get(LoggerService);

  protected tokenService = Container.get(TokenService);

  protected getCurrentUser = (req: Request) => this.tokenService.getCurrentUser(req);

  protected errorHandler = (e: any, res: Response, statusCode = 500) => {
    this.loggerService.error(e);

    let error = `${e?.name}: ${e?.message}`;

    if (e?.name === 'ValidationError') {
      error = `${e?.name}: "${e?.path}" ${e?.message}`;
    }

    res.status(statusCode).json({ error });
  };
}
