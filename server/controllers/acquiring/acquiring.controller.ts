import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AcquiringService } from '@server/services/acquiring/acquiring.service';

@Singleton
export class AcquiringController extends BaseService {
  private readonly acquiringService = Container.get(AcquiringService);

  private readonly TAG = 'AcquiringController';

  public checkYookassaOrder = async (req: Request, res: Response) => {
    this.loggerService.info(this.TAG, `Уведомление от YooKassa: ${JSON.stringify(req.body)}`);
    try {
      if (req.body?.type !== 'notification' || (req.body?.event !== 'payment.canceled' && req.body?.event !== 'payment.succeeded')) {
        this.loggerService.info(this.TAG, 'Ошибочный тип запроса');
        res.status(404).json({ message: 'Ошибочный тип запроса' });
        return;
      }
      if (!req.body?.object?.id) {
        this.loggerService.info(this.TAG, 'Не указан номер транзакции');
        res.status(404).json({ message: 'Не указан номер транзакции' });
        return;
      }

      res.json(await this.acquiringService.checkYookassaOrder(req.body.object));
    } catch (e) {
      this.loggerService.error(e);
      res.status(404).json(e);
    }
  };
}
