import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { GradeService } from '@server/services/rating/grade.service';
import { paramsIdSchema, queryOptionalSchema, queryPaginationWithParams } from '@server/utilities/convertation.params';
import { newGradeValidation } from '@/validations/validations';
import { GradeEntity } from '@server/db/entities/grade.entity';

@Singleton
export class GradeController extends BaseService {
  private readonly gradeService = Container.get(GradeService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const grade = await this.gradeService.findOne(params, user.lang, query);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const { comment, ...body } = await newGradeValidation.serverValidator(req.body) as GradeEntity;

      const grade = await this.gradeService.createOne(body, user, comment);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getUnchekedGrades = async (req: Request, res: Response) => {
    try {
      const query = await queryPaginationWithParams.validate(req.query);

      const [items, count] = await this.gradeService.getUnchekedGrades(query);

      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };

      res.json({ code: 1, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public accept = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const grade = await this.gradeService.accept(params, user.lang);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const grade = await this.gradeService.deleteOne(params, user.lang);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const grade = await this.gradeService.restoreOne(params, user.lang);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
