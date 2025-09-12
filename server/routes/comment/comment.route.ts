import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { CommentController } from '@server/controllers/comment/comment.controller';

@Singleton
export class CommentRoute extends BaseRouter {
  private readonly commentController = Container.get(CommentController);

  public set = (router: Router) => {
    router.post(this.routes.comment.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.commentController.createOne);
    router.delete(this.routes.comment.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.commentController.deleteOne);
  };
}
