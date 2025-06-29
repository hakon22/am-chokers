import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { CartController } from '@server/controllers/cart/cart.controller';

@Singleton
export class CartRoute extends BaseRouter {
  private readonly cartController = Container.get(CartController);

  public set = (router: Router) => {
    router.post(this.routes.createCartItem, this.middlewareService.optionalJwtAuth, this.cartController.createOne);
    router.get(this.routes.incrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.incrementOne);
    router.get(this.routes.decrementCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.decrementOne);
    router.delete(this.routes.removeCartItem(), this.middlewareService.optionalJwtAuth, this.cartController.deleteOne);
    router.post(this.routes.removeManyCartItems, this.middlewareService.optionalJwtAuth, this.cartController.deleteMany);
    router.post(this.routes.getCart, this.middlewareService.jwtToken, this.cartController.findMany);
    router.get(this.routes.reports.cart, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.cartController.cartReport);
  };
}
