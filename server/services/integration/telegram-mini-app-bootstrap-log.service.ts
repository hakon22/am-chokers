import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { LoggerService } from '@server/services/app/logger.service';
import { telegramMiniAppBootstrapLogValidation } from '@/validations/validations';
import type { TelegramMiniAppBootstrapLogEvent } from '@shared/telegram-mini-app-bootstrap-log-event';

@Singleton
export class TelegramMiniAppBootstrapLogService {
  private readonly TAG = 'TelegramMiniAppBootstrap';

  private readonly loggerService = Container.get(LoggerService);

  /**
   * Принимает диагностическое событие bootstrap Mini App и пишет его в серверный лог
   * @param req - HTTP-запрос Express с телом события
   * @param res - HTTP-ответ Express (204 без тела)
   * @returns Promise после записи лога
   */
  public logBootstrapEvent = async (req: Request, res: Response): Promise<void> => {
    try {
      const event = await telegramMiniAppBootstrapLogValidation.serverValidator(req.body) as TelegramMiniAppBootstrapLogEvent;

      this.loggerService.info(this.TAG, JSON.stringify(event));
      res.sendStatus(204);
    } catch (error) {
      this.loggerService.warn(this.TAG, 'Invalid bootstrap log event', error);
      res.sendStatus(400);
    }
  };
}
