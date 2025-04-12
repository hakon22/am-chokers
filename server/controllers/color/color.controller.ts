import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { ColorEntity } from '@server/db/entities/color.entity';
import { BaseService } from '@server/services/app/base.service';
import { newColorValidation } from '@/validations/validations';
import { ColorService } from '@server/services/color/color.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ColorController extends BaseService {
  private readonly colorService = Container.get(ColorService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const color = await this.colorService.findOne(params, query);

      res.json({ code: 1, color });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const colors = await this.colorService.findMany(query);

      res.json({ code: 1, colors });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = await newColorValidation.serverValidator(req.body) as ColorEntity;

      const result = await this.colorService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = await newColorValidation.serverValidator(req.body) as ColorEntity;

      const color = await this.colorService.updateOne(params, body);

      res.json({ code: 1, color });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const color = await this.colorService.deleteOne(params);

      res.json({ code: 1, color });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const color = await this.colorService.restoreOne(params);

      res.json({ code: 1, color });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
