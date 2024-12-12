import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import type { ItemEntity } from '@server/db/entities/item.entity';
import { BaseService } from '@server/services/app/base.service';
import { newItemValidation } from '@/validations/validations';
import { ItemService } from '@server/services/item/item.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ItemController extends BaseService {
  private readonly itemService = Container.get(ItemService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const item = await this.itemService.findOne(params, query);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const items = await this.itemService.findMany(query);

      res.json({ code: 1, items });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { images, ...body } = req.body as ItemEntity;
      await newItemValidation.serverValidator({ ...body });

      const result = await this.itemService.createOne(body as ItemEntity, images);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = req.body as ItemEntity;

      const { item, url } = await this.itemService.updateOne(params, body);

      res.json({ code: 1, item, url });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.deleteOne(params);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.restoreOne(params);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
