import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { BaseService } from '@server/services/app/base.service';
import { newItemGroupValidation } from '@/validations/validations';
import { ItemGroupService } from '@server/services/item/item.group.service';
import { paramsIdSchema, queryOptionalSchema } from '@server/utilities/convertation.params';

@Singleton
export class ItemGroupController extends BaseService {
  private readonly itemGroupService = Container.get(ItemGroupService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const itemGroup = await this.itemGroupService.findOne(params, query);

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

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = req.body as ItemGroupEntity;
      await newItemGroupValidation.serverValidator({ ...body });

      const result = await this.itemGroupService.createOne(body);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = req.body as ItemGroupEntity;

      const itemGroup = await this.itemGroupService.updateOne(params, body);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const itemGroup = await this.itemGroupService.deleteOne(params);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const itemGroup = await this.itemGroupService.restoreOne(params);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
