import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ColorController } from '@server/controllers/color/color.controller';

@Singleton
export class ColorRoute extends BaseRouter {
  private readonly colorController = Container.get(ColorController);

  public set = (router: Router) => {
    router.get(this.routes.getColors, this.colorController.findMany);
    router.get(this.routes.getColor(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.findOne);
    router.post(this.routes.createColor, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.createOne);
    router.put(this.routes.updateColor(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.updateOne);
    router.delete(this.routes.removeColor(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.deleteOne);
    router.patch(this.routes.restoreColor(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.restoreOne);
  };
}
