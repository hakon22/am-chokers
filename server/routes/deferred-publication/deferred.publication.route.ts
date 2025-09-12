import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ReportController } from '@server/controllers/report/report.controller';

@Singleton
export class ReportRoute extends BaseRouter {
  private readonly reportController = Container.get(ReportController);

  public set = (router: Router) => {
    router.get(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.findMany);
    router.get(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.findOne);
    router.post(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.createOne);
    router.put(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.updateOne);
    router.delete(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.deleteOne);
    router.patch(this.routes.item, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.colorController.restoreOne);
  };
}
