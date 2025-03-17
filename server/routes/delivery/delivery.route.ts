import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { DeliveryController } from '@server/controllers/delivery/delivery.controller';

@Singleton
export class DeliveryRoute extends BaseRouter {

  private readonly deliveryController = Container.get(DeliveryController);

  public set = (router: Router) => {
    router.get(this.routes.delivery.findMany, this.deliveryController.findMany);
  };
}
