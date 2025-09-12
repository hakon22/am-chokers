import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { CompositionController } from '@server/controllers/composition/composition.controller';

@Singleton
export class CompositionRoute extends BaseRouter {
  private readonly compositionController = Container.get(CompositionController);

  public set = (router: Router) => {
    router.get(this.routes.composition.findMany, this.compositionController.findMany);
    router.get(this.routes.composition.findOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.findOne);
    router.post(this.routes.composition.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.createOne);
    router.put(this.routes.composition.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.updateOne);
    router.delete(this.routes.composition.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.deleteOne);
    router.patch(this.routes.composition.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.restoreOne);
  };
}
