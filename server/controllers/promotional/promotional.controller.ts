import type { Request, Response } from 'express';
import moment from 'moment';
import { Container, Singleton } from 'typescript-ioc';

import { PromotionalEntity } from '@server/db/entities/promotional.entity';
import { BaseService } from '@server/services/app/base.service';
import { newPromotionalValidation } from '@/validations/validations';
import { PromotionalService } from '@server/services/promotional/promotional.service';
import { paramsIdSchema, queryPromotionalParams, queryNameParams } from '@server/utilities/convertation.params';

@Singleton
export class PromotionalController extends BaseService {
  private readonly promotionalService = Container.get(PromotionalService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryPromotionalParams.validate(req.query);

      const promotional = await this.promotionalService.findOne(params, query);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findByName = async (req: Request, res: Response) => {
    try {
      const query = await queryNameParams.validate(req.query);

      const promotional = await this.promotionalService.findByName(query);

      if (!promotional) {
        res.json({ code: 2 });
        return;
      }

      if (!moment().isBetween(moment(promotional.start), moment(promotional.end), 'day', '[]') || !promotional.active) {
        res.json({ code: 3 });
        return;
      }

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryPromotionalParams.validate(req.query);

      const promotionals = await this.promotionalService.findMany(query);

      res.json({ code: 1, promotionals });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = await newPromotionalValidation.serverValidator(req.body) as PromotionalEntity;

      const result = await this.promotionalService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = await newPromotionalValidation.serverValidator(req.body) as PromotionalEntity;

      const promotional = await this.promotionalService.updateOne(params, body);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const promotional = await this.promotionalService.deleteOne(params);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const promotional = await this.promotionalService.restoreOne(params);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
