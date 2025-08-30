import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { CommentService } from '@server/services/comment/comment.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';
import { newCommentValidation } from '@/validations/validations';
import { CommentEntity } from '@server/db/entities/comment.entity';

@Singleton
export class CommentController extends BaseService {
  private readonly commentService = Container.get(CommentService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const comment = await this.commentService.findOne(params, user.lang, query);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const comments = await this.commentService.findMany(query);

      res.json({ code: 1, comments });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const { images, ...body } = await newCommentValidation.serverValidator(req.body) as CommentEntity;

      const comment = await this.commentService.createOne(body, images, user);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const comment = await this.commentService.deleteOne(params, user.lang);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const comment = await this.commentService.restoreOne(params, user.lang);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
