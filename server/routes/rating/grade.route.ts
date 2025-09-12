import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { GradeController } from '@server/controllers/rating/grade.controller';

@Singleton
export class GradeRoute extends BaseRouter {
  private readonly gradeController = Container.get(GradeController);

  public set = (router: Router) => {
    router.post(this.routes.grade.createOne(), this.middlewareService.jwtToken, this.gradeController.createOne);
    router.delete(this.routes.grade.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.deleteOne);
    router.get(this.routes.grade.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.restoreOne);
    router.get(this.routes.grade.accept(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.accept);
    router.get(this.routes.grade.getUnchekedGrades, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.gradeController.getUnchekedGrades);
  
  };
}
