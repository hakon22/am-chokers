import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import type { PassportRequestInterface } from '@server/types/user/user.request.interface';
import { BaseService } from '@server/services/app/base.service';
import { GradeService } from '@server/services/rating/grade.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';
import { newGradeValidation } from '@/validations/validations';
import { GradeEntity } from '@server/db/entities/grade.entity';

@Singleton
export class GradeController extends BaseService {
  private readonly gradeService = Container.get(GradeService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const grade = await this.gradeService.findOne(params, query);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const grades = await this.gradeService.findMany(query);

      res.json({ code: 1, grades });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { id } = req.user as PassportRequestInterface;
      const { comment, ...body } = req.body as GradeEntity;
      await newGradeValidation.serverValidator(body);

      const grade = await this.gradeService.createOne(body, id, comment);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const grade = await this.gradeService.deleteOne(params);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const grade = await this.gradeService.restoreOne(params);

      res.json({ code: 1, grade });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
