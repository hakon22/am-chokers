import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { OrderController } from '@server/controllers/order/order.controller';

@Singleton
export class OrderRoute extends BaseRouter {
  private readonly orderController = Container.get(OrderController);

  public set = (router: Router) => {
    router.get(this.routes.getOrders, this.middlewareService.jwtToken, this.orderController.findMany);
    router.get(this.routes.cancelOrder(), this.middlewareService.jwtToken, this.orderController.cancel);
    router.get(this.routes.payOrder(), this.middlewareService.jwtToken, this.orderController.pay);
    router.get(this.routes.getAllOrders, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.getAllOrders);
    router.post(this.routes.createOrder, this.middlewareService.optionalJwtAuth, this.orderController.createOne);
    router
      .get(this.routes.crudOrder(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.findOne)
      .patch(this.routes.crudOrder(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.updateStatus);
  };
}
