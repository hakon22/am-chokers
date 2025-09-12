import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ColorController } from '@server/controllers/color/color.controller';

@Singleton
export class ColorRoute extends BaseRouter {
  private readonly colorController = Container.get(ColorController);

  public set = (router: Router) => {
    router.get(this.routes.color.findMany, this.colorController.findMany);
    router.get(this.routes.color.findOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.findOne);
    router.post(this.routes.color.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.createOne);
    router.put(this.routes.color.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.updateOne);
    router.delete(this.routes.color.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.deleteOne);
    router.patch(this.routes.color.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.restoreOne);
  };
}
