import { Container } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { DatabaseService } from '@server/db/database.service';
import { RedisService } from '@server/db/redis.service';
import { LoggerService } from '@server/services/app/logger.service';
import { TokenService } from '@server/services/user/token.service';
import { BullMQQueuesService } from '@microservices/sender/queues/bull-mq-queues.service';
import { UserEntity } from '@server/db/entities/user.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { buildValidationErrorResponse, isValidationErrorKey } from '@server/utilities/api-error-response.util';

export abstract class BaseService {
  protected databaseService = Container.get(DatabaseService);

  protected redisService = Container.get(RedisService);

  protected loggerService = Container.get(LoggerService);

  protected tokenService = Container.get(TokenService);

  protected getCurrentUser = (req: Request) => this.tokenService.getCurrentUser(req);

  protected errorHandler = (e: any, res: Response, statusCode = 500) => {
    this.loggerService.error(e);

    let error = `${e?.name}: ${e?.message}`;
    let responseStatusCode = statusCode;

    if (e?.name === 'ValidationError' && typeof e.message === 'string' && isValidationErrorKey(e.message)) {
      res.status(400).json(buildValidationErrorResponse(e.message, e.params));
      return;
    }

    if (e?.name === 'ValidationError') {
      error = `${e?.name}: "${e?.path}" ${e?.message}`;
      responseStatusCode = 400;
    }

    if (e instanceof Error && e.stack && process.env.TELEGRAM_CHAT_ID && process.env.NODE_ENV === 'production') {
      UserEntity.findOne({ select: ['id', 'lang'], where: { telegramId: process.env.TELEGRAM_CHAT_ID } })
        .then((adminUser) => {
          if (!adminUser) {
            return;
          }
          const message = adminUser.lang === UserLangEnum.RU ? [
            `Ошибка на сервере <b>${process.env.NEXT_PUBLIC_APP_NAME}</b>:`,
            `<pre><code class="language-typescript">${e.stack}</code></pre>`,
          ] : [
            `Error on <b>${process.env.NEXT_PUBLIC_APP_NAME}</b> server:`,
            `<pre><code class="language-typescript">${e.stack}</code></pre>`,
          ];

          Container.get(BullMQQueuesService).sendTelegramMessage({ message, telegramId: process.env.TELEGRAM_CHAT_ID as string });
        })
        .catch(this.loggerService.error);
    }

    res.status(responseStatusCode).json({ error });
  };
}
