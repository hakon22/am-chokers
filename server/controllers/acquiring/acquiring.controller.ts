import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AcquiringService } from '@server/services/acquiring/acquiring.service';

@Singleton
export class AcquiringController extends BaseService {
  private readonly acquiringService = Container.get(AcquiringService);

  public checkYookassaOrder = async (req: Request, res: Response) => {
    try {
      if (!req.body.orderId) {
        return res.status(404).json({ message: 'Не указан номер транзакции.' });
      }

      await this.acquiringService.checkYookassaOrder(req.body);

      res.json({ code: 1 });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
