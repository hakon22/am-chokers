import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { BaseService } from '@server/services/app/base.service';
import { newItemCatalogValidation } from '@/validations/validations';
import { ItemCollectionService } from '@server/services/item/item.collection.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ItemCollectionController extends BaseService {
  private readonly itemCollectionService = Container.get(ItemCollectionService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const itemCollection = await this.itemCollectionService.findOne(params, query);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const itemCollections = await this.itemCollectionService.findMany(query);

      res.json({ code: 1, itemCollections });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = req.body as ItemCollectionEntity;
      await newItemCatalogValidation.serverValidator({ ...body });

      const result = await this.itemCollectionService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = req.body as ItemCollectionEntity;

      const itemCollection = await this.itemCollectionService.updateOne(params, body);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const itemCollection = await this.itemCollectionService.deleteOne(params);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const itemCollection = await this.itemCollectionService.restoreOne(params);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
