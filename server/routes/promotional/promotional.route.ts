import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { PromotionalController } from '@server/controllers/promotional/promotional.controller';

@Singleton
export class PromotionalRoute extends BaseRouter {
  private readonly promotionalController = Container.get(PromotionalController);

  public set = (router: Router) => {
    router.get(this.routes.promotional.findOneByName, this.promotionalController.findByName);
    router.get(this.routes.promotional.findMany, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findMany);
    router.get(this.routes.promotional.findOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.findOne);
    router.post(this.routes.promotional.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.createOne);
    router.put(this.routes.promotional.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.updateOne);
    router.delete(this.routes.promotional.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.deleteOne);
    router.patch(this.routes.promotional.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.promotionalController.restoreOne);

  };
}
