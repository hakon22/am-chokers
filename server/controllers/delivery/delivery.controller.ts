import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { DeliveryService } from '@server/services/delivery/delivery.service';

@Singleton
export class DeliveryController extends BaseService {
  private readonly deliveryService = Container.get(DeliveryService);

  public findMany = async (req: Request, res: Response) => {
    try {
      const deliveryList = await this.deliveryService.findMany();

      res.json({ code: 1, deliveryList });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
