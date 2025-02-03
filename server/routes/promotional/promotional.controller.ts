import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { PromotionalController } from '@server/controllers/promotional/promotional.controller';

@Singleton
export class PromotionalRoute extends BaseRouter {
  private readonly promotionalController = Container.get(PromotionalController);

  public set = (router: Router) => {
    router.get(this.routes.getPromotionalByName, this.promotionalController.findByName);
    router.get(this.routes.getPromotionals, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findMany);
    router.get(this.routes.getPromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findOne);
    router.post(this.routes.createPromotional, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.createOne);
    router.put(this.routes.updatePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.updateOne);
    router.delete(this.routes.removePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.deleteOne);
    router.patch(this.routes.restorePromotional(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.restoreOne);

  };
}
