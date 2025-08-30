import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { BaseService } from '@server/services/app/base.service';
import { newItemCollectionValidation } from '@/validations/validations';
import { ItemCollectionService } from '@server/services/item/item.collection.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ItemCollectionController extends BaseService {
  private readonly itemCollectionService = Container.get(ItemCollectionService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const itemCollection = await this.itemCollectionService.findOne(params, user.lang, query);

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
      const body = await newItemCollectionValidation.serverValidator(req.body) as ItemCollectionEntity;

      const result = await this.itemCollectionService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await newItemCollectionValidation.serverValidator(req.body) as ItemCollectionEntity;

      const result = await this.itemCollectionService.updateOne(params, body, user.lang);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const itemCollection = await this.itemCollectionService.deleteOne(params, user.lang);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const itemCollection = await this.itemCollectionService.restoreOne(params, user.lang);

      res.json({ code: 1, itemCollection });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
