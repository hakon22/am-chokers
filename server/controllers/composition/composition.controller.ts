import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { CompositionEntity } from '@server/db/entities/composition.entity';
import { BaseService } from '@server/services/app/base.service';
import { newCompositionValidation } from '@/validations/validations';
import { CompositionService } from '@server/services/composition/composition.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class CompositionController extends BaseService {
  private readonly compositionService = Container.get(CompositionService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const composition = await this.compositionService.findOne(params, query);

      res.json({ code: 1, composition });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const compositions = await this.compositionService.findMany(query);

      res.json({ code: 1, compositions });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = await newCompositionValidation.serverValidator(req.body) as CompositionEntity;

      const result = await this.compositionService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = req.body as CompositionEntity;

      const composition = await this.compositionService.updateOne(params, body);

      res.json({ code: 1, composition });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const composition = await this.compositionService.deleteOne(params);

      res.json({ code: 1, composition });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const composition = await this.compositionService.restoreOne(params);

      res.json({ code: 1, composition });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
