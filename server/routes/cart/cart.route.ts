import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { CartController } from '@server/controllers/cart/cart.controller';

@Singleton
export class CartRoute extends BaseRouter {
  private readonly cartController = Container.get(CartController);

  public set = (router: Router) => {
    router.post(this.routes.cart.createOne, this.middlewareService.optionalJwtAuth, this.cartController.createOne);
    router.get(this.routes.cart.incrementOne(), this.middlewareService.optionalJwtAuth, this.cartController.incrementOne);
    router.get(this.routes.cart.decrementOne(), this.middlewareService.optionalJwtAuth, this.cartController.decrementOne);
    router.delete(this.routes.cart.deleteOne(), this.middlewareService.optionalJwtAuth, this.cartController.deleteOne);
    router.post(this.routes.cart.deleteMany, this.middlewareService.optionalJwtAuth, this.cartController.deleteMany);
    router.post(this.routes.cart.findMany, this.middlewareService.jwtToken, this.cartController.findMany);
  };
}
