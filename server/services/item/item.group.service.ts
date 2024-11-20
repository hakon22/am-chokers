import type { Request, Response } from 'express';
import { Singleton } from 'typescript-ioc';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { ItemGroupQueryInterface } from '@server/types/item/item.group.query.interface';
import { BaseService } from '@server/services/app/base.service';
import { newItemGroupValidation } from '@/validations/validations';

@Singleton
export class ItemGroupService extends BaseService {

  private createQueryBuilder = (query?: ItemGroupQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemGroupEntity, 'itemGroup')
      .select([
        'itemGroup.id',
        'itemGroup.name',
        'itemGroup.description',
        'itemGroup.code',
        'itemGroup.deleted',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.id) {
      builder.andWhere('itemGroup.id = :id', { id: query.id });
    }
    if (query?.code) {
      builder.andWhere('itemGroup.code = :code', { code: query.code });
    }

    return builder;
  };

  private find = (query: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    return builder.getOne();
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const payload = req.body as ItemGroupEntity;
      await newItemGroupValidation.serverValidator({ ...payload });

      const isExist = await this.find({ code: payload.code, withDeleted: true });

      if (isExist) {
        res.json({ code: 2 });
        return;
      }

      const itemGroup = await ItemGroupEntity.save(payload);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const itemGroup = await this.find(query);

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const builder = this.createQueryBuilder(query);

      const itemGroups = await builder.getMany();

      res.json({ code: 1, itemGroups });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const body = req.body as ItemGroupEntity;

      const itemGroup = await this.find({ id: body.id });

      if (!itemGroup) {
        throw new Error(`Группы товаров с id #${body?.id} не существует`);
      }

      const updatedItemGroup = { ...itemGroup, ...body };
      
      await ItemGroupEntity.update(itemGroup.id, updatedItemGroup);

      res.json({ code: 1, itemGroup: updatedItemGroup });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const itemGroup = await this.find(query);

      if (!itemGroup) {
        throw new Error(`Группы товаров с id #${query?.id} не существует`);
      }

      await itemGroup.softRemove();

      res.json({ code: 1, id: itemGroup.id });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const deletedItemGroup = await this.find(query);

      if (!deletedItemGroup) {
        throw new Error(`Группы товаров с id #${query?.id} не существует`);
      }

      const itemGroup = await deletedItemGroup.recover();

      res.json({ code: 1, itemGroup });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };
}
