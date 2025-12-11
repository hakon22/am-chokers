import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ReportController } from '@server/controllers/report/report.controller';

@Singleton
export class ReportRoute extends BaseRouter {
  private readonly reportController = Container.get(ReportController);

  public set = (router: Router) => {
    router.get(this.routes.reports.cart, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.reportController.cartReport);
    router.get(this.routes.reports.message, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.reportController.messageReport);
    router.get(this.routes.reports.metrica, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.reportController.metricaReport);
  };
}
