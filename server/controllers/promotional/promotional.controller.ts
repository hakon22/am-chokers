import type { Request, Response } from 'express';
import moment from 'moment';
import { Container, Singleton } from 'typescript-ioc';

import { PromotionalEntity } from '@server/db/entities/promotional.entity';
import { BaseService } from '@server/services/app/base.service';
import { CartService } from '@server/services/cart/cart.service';
import { newPromotionalValidation, queryActivatePromotionalParams } from '@/validations/validations';
import { PromotionalService } from '@server/services/promotional/promotional.service';
import { paramsIdSchema, queryPromotionalParams } from '@server/utilities/convertation.params';

@Singleton
export class PromotionalController extends BaseService {
  private readonly promotionalService = Container.get(PromotionalService);

  private readonly cartService = Container.get(CartService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryPromotionalParams.validate(req.query);

      const promotional = await this.promotionalService.findOne(params, user.lang, query);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findByName = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await queryActivatePromotionalParams.validate(req.query);

      const promotional = await this.promotionalService.findByName(query);

      if (!promotional) {
        res.json({ code: 2 });
        return;
      }

      if (!moment().isBetween(moment(promotional.start), moment(promotional.end), 'day', '[]') || !promotional.active) {
        res.json({ code: 3 });
        return;
      }

      if (promotional.items.length) {
        const cart = await this.cartService.findMany(null, undefined, { ids: query.cartIds });

        const cartItemIds = cart.map(({ item }) => item.id);

        if (!promotional.items.some(({ id }) => cartItemIds.includes(id))) {
          res.json({ code: 4 });
          return;
        }
      }

      if (promotional.users.length && !promotional.users.find(({ id }) => id === user?.id)) {
        res.json({ code: 5 });
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
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await newPromotionalValidation.serverValidator(req.body) as PromotionalEntity;

      const promotional = await this.promotionalService.updateOne(params, body, user.lang);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const promotional = await this.promotionalService.deleteOne(params, user.lang);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const promotional = await this.promotionalService.restoreOne(params, user.lang);

      res.json({ code: 1, promotional });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
