import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { itemGroupSchema, newItemGroupValidation } from '@/validations/validations';
import { ItemGroupService } from '@server/services/item/item.group.service';
import { paramsIdSchema, queryCodeParams, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ItemGroupController extends BaseService {
  private readonly itemGroupService = Container.get(ItemGroupService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const itemGroup = await this.itemGroupService.findOne(params, user.lang, query);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);

      const itemGroups = await this.itemGroupService.findMany(query);

      res.json({ code: 1, itemGroups });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getByCode = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await queryCodeParams.validate(req.query);
  
      const itemGroup = await this.itemGroupService.getByCode(query, user.lang);
  
      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = await newItemGroupValidation.serverValidator(req.body) as ItemGroupEntity;

      const result = await this.itemGroupService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await newItemGroupValidation.serverValidator(req.body) as ItemGroupEntity;

      const result = await this.itemGroupService.updateOne(params, body, user.lang);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const itemGroup = await this.itemGroupService.deleteOne(params, user.lang);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const itemGroup = await this.itemGroupService.restoreOne(params, user.lang);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public sort = async (req: Request, res: Response) => {
    try {
      const query = await queryOptionalSchema.validate(req.query);
      const body = await itemGroupSchema.validate(req.body);

      const itemGroups = await this.itemGroupService.sort(body, query);

      res.json({ code: 1, itemGroups });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
