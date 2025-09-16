import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { DeferredPublicationController } from '@server/controllers/deferred-publication/deferred-publication.controller';

@Singleton
export class DeferredPublicationRoute extends BaseRouter {
  private readonly deferredPublicationController = Container.get(DeferredPublicationController);

  public set = (router: Router) => {
    router.get(this.routes.deferredPublication.telegram.findMany, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.deferredPublicationController.findMany);
    router.get(this.routes.deferredPublication.telegram.findOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.deferredPublicationController.findOne);
    router.put(this.routes.deferredPublication.telegram.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.deferredPublicationController.updateOne);
    router.delete(this.routes.deferredPublication.telegram.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.deferredPublicationController.deleteOne);
    router.patch(this.routes.deferredPublication.telegram.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.deferredPublicationController.restoreOne);
  };
}
