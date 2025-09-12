import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ReportController } from '@server/controllers/report/report.controller';

@Singleton
export class DeferredPublicationRoute extends BaseRouter {
  private readonly reportController = Container.get(ReportController);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public set = (router: Router) => {};
}
