import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { descriptionSchema, newItemValidation, partialUpdateItemValidation } from '@/validations/validations';
import { ItemService } from '@server/services/item/item.service';
import { paramsIdSchema, queryOptionalSchema, queryPaginationSchema, queryItemsParams, querySearchParams, queryTranslateNameParams } from '@server/utilities/convertation.params';
import type { ItemEntity } from '@server/db/entities/item.entity';

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

  public getList = async (req: Request, res: Response) => {
    try {
      const query = await queryItemsParams.validate(req.query);

      const [items, count] = await this.itemService.getList(query);

      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };

      res.json({ code: 1, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getLinks = async (req: Request, res: Response) => {
    try {
      const links = await this.itemService.getLinks();

      res.json({ code: 1, links });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getSpecials = async (req: Request, res: Response) => {
    try {
      const specialItems = await this.itemService.getSpecials();

      res.json({ code: 1, specialItems });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getByName = async (req: Request, res: Response) => {
    try {
      const query = await queryTranslateNameParams.validate(req.query);

      const item = await this.itemService.getByName(query);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public search = async (req: Request, res: Response) => {
    try {
      const query = await querySearchParams.validate(req.query);

      const search = await this.itemService.search(query);

      res.json({ code: 1, search });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const body = await newItemValidation.serverValidator(req.body) as ItemEntity;

      const { images, ...rest } = body;

      const result = await this.itemService.createOne(rest as ItemEntity, images);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = await newItemValidation.serverValidator(req.body) as ItemEntity;

      const { item, url } = await this.itemService.updateOne(params, body);

      res.json({ code: 1, item, url });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public partialUpdateOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = await partialUpdateItemValidation.serverValidator(req.body) as ItemEntity;

      const { item, url } = await this.itemService.partialUpdateOne(params, body);

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

  public publishToTelegram = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const body = await descriptionSchema.validate(req.body);

      const item = await this.itemService.publishToTelegram(params, body.description);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getGrades = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryPaginationSchema.validate(req.query);

      const [items, count] = await this.itemService.getGrades(params, query);

      const paginationParams = {
        count,
        limit: query.limit,
        offset: query.offset,
      };

      res.json({ code: 1, id: params.id, items, paginationParams });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getListExcel = async (req: Request, res: Response) => {
    try {

      const buffer = await this.itemService.getListExcel();

      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename=item-register.xlsx');
      res
        .send(buffer)
        .end();
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
