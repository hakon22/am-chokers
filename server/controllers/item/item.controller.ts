import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { publishTelegramValidation, newItemValidation, partialUpdateItemValidation } from '@/validations/validations';
import { ItemService } from '@server/services/item/item.service';
import { ItemHistoryService } from '@server/services/item/item.history.service';
import { paramsIdSchema, queryOptionalSchema, queryPaginationSchema, queryItemsParams, querySearchParams, queryTranslateNameParams, isFullParams, bodyItemBulkOutStockSchema, bodyItemBulkOutStockClearSchema, bodyItemBulkPriceAdjustSchema } from '@server/utilities/convertation.params';
import type { ItemEntity } from '@server/db/entities/item.entity';
import type { PublishTelegramInterface } from '@/slices/appSlice';

@Singleton
export class ItemController extends BaseService {
  private readonly itemService = Container.get(ItemService);

  private readonly itemHistoryService = Container.get(ItemHistoryService);

  /**
   * Возвращает постраничную историю изменений товара (только админ)
   * @param req - HTTP-запрос с `params.id` и `query.limit` / `query.offset`
   * @param res - HTTP-ответ JSON `{ code, history, paginationParams }`
   * @returns `Promise`, завершающийся после отправки JSON через `res.json` (`code`, `history`, `paginationParams`)
   */
  public getItemHistory = async (req: Request, res: Response) => {
    try {
      this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryPaginationSchema.validate(req.query);
      const limitCandidate = query.limit;
      const limit = Math.min(
        200,
        Number.isFinite(limitCandidate) && (limitCandidate as number) >= 1 ? (limitCandidate as number) : 50,
      );
      const offsetCandidate = query.offset;
      const offset = Number.isFinite(offsetCandidate) && (offsetCandidate as number) >= 0
        ? (offsetCandidate as number)
        : 0;

      const [history, count] = await this.itemHistoryService.findManyByItemId({
        itemId: params.id,
        limit,
        offset,
      });

      res.json({
        code: 1,
        history,
        paginationParams: {
          count,
          limit,
          offset,
        },
      });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const query = await queryOptionalSchema.validate(req.query);

      const item = await this.itemService.findOne(params, user.lang, query);

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
      const user = this.getCurrentUser(req);
      const query = await isFullParams.validate(req.query);
      const specialItems = await this.itemService.getSpecials(!!user?.isAdmin, query?.isFull);

      res.json({ code: 1, specialItems });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getByName = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await queryTranslateNameParams.validate(req.query);

      const item = await this.itemService.getByName(query, user.lang);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public search = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const query = await querySearchParams.validate(req.query);

      const search = await this.itemService.search(query, user.lang);

      res.json({ code: 1, search });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const body = await newItemValidation.serverValidator(req.body) as ItemEntity;

      const { images, ...rest } = body;

      const result = await this.itemService.createOne(rest as ItemEntity, images, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await newItemValidation.serverValidator(req.body) as ItemEntity;

      const result = await this.itemService.updateOne(params, body, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public partialUpdateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await partialUpdateItemValidation.serverValidator(req.body) as ItemEntity;

      const result = await this.itemService.partialUpdateOne(params, body, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.deleteOne(params, user);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const item = await this.itemService.restoreOne(params, user);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public publishToTelegram = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await publishTelegramValidation.serverValidator(req.body) as PublishTelegramInterface;

      const item = await this.itemService.publishToTelegram(params, user, body);

      res.json({ code: 1, item });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getCacheInfo = async (req: Request, res: Response) => {
    try {
      const result = await this.itemService.getCacheInfo();

      res.json({ code: 1, result });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public synchronizationCache = async (req: Request, res: Response) => {
    try {
      await this.itemService.synchronizationCache({ forced: true });

      res.json({ code: 1 });
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

  public getStatistics = async (req: Request, res: Response) => {
    try {
      const query = await queryItemsParams.validate(req.query);

      const statistics = await this.itemService.getStatistics(query);

      res.json({ code: 1, statistics });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getListExcel = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const buffer = await this.itemService.getListExcel(user.lang);

      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename=item-register.xlsx');
      res
        .send(buffer)
        .end();
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public bulkSetOutStock = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const body = await bodyItemBulkOutStockSchema.validate(req.body);

      const result = await this.itemService.bulkSetOutStock(body, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public bulkClearOutStock = async (req: Request, res: Response) => {
    try {
      const body = await bodyItemBulkOutStockClearSchema.validate(req.body);

      const user = this.getCurrentUser(req);
      const result = await this.itemService.bulkClearOutStock(body, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public bulkPriceAdjust = async (req: Request, res: Response) => {
    try {
      const body = await bodyItemBulkPriceAdjustSchema.validate(req.body);

      const user = this.getCurrentUser(req);
      const result = await this.itemService.bulkPriceAdjust(body, user);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
