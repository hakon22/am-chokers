import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { CompositionController } from '@server/controllers/composition/composition.controller';

@Singleton
export class CompositionRoute extends BaseRouter {
  private readonly compositionController = Container.get(CompositionController);

  public set = (router: Router) => {
    router.get(this.routes.getCompositions, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.findMany);
    router.get(this.routes.getComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.findOne);
    router.post(this.routes.createComposition, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.createOne);
    router.put(this.routes.updateComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.updateOne);
    router.delete(this.routes.removeComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.deleteOne);
    router.patch(this.routes.restoreComposition(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.compositionController.restoreOne);
  };
}
