import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { OrderController } from '@server/controllers/order/order.controller';

@Singleton
export class OrderRoute extends BaseRouter {
  private readonly orderController = Container.get(OrderController);

  public set = (router: Router) => {
    router.get(this.routes.order.getUserOrders, this.middlewareService.jwtToken, this.orderController.getUserOrders);
    router.get(this.routes.order.cancel(), this.middlewareService.jwtToken, this.orderController.cancel);
    router.get(this.routes.order.pay(), this.middlewareService.jwtToken, this.orderController.pay);
    router.get(this.routes.order.getAllOrders, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.getAllOrders);
    router.post(this.routes.order.createOne, this.middlewareService.optionalJwtAuth, this.orderController.createOne);
    router
      .get(this.routes.order.findOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.findOne)
      .patch(this.routes.order.updateStatus(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.orderController.updateStatus);
  };
}
