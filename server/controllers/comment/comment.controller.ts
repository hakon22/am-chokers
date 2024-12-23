import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
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
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const comment = await this.commentService.findOne(params, query);

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
      const { id } = req.user as PassportRequestInterface;
      const { images, ...body } = req.body as CommentEntity;
      await newCommentValidation.serverValidator(body);

      const comment = await this.commentService.createOne(body, images, id);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const comment = await this.commentService.deleteOne(params);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const comment = await this.commentService.restoreOne(params);

      res.json({ code: 1, comment });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
