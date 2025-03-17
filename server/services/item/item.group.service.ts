import { Container, Singleton } from 'typescript-ioc';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { ItemEntity } from '@server/db/entities/item.entity';
import type { ItemGroupQueryInterface } from '@server/types/item/item.group.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class ItemGroupService extends BaseService {
  private readonly itemService = Container.get(ItemService);

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
    if (query?.code) {
      builder.andWhere('itemGroup.code = :code', { code: query.code });
    }

    return builder;
  };

  public exist = async (query: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ItemGroupEntity) => {
    const isExist = await this.exist({ code: body.code });

    if (isExist) {
      return { code: 2 };
    }

    const itemGroup = await ItemGroupEntity.save(body);

    return { code: 1, itemGroup };
  };

  public findOne = async (params: ParamsIdInterface, query?: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('itemGroup.id = :id', { id: params.id });

    const itemGroup = await builder.getOne();

    if (!itemGroup) {
      throw new Error(`Группы товаров с номером #${params.id} не существует.`);
    }

    return itemGroup;
  };

  public findMany = async (query?: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const itemGroups = await builder.getMany();

    return itemGroups;
  };

  public getByCode = async (query: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query);
  
    const itemGroup = await builder.getOne();
  
    if (!itemGroup) {
      throw new Error(`Группы товаров с кодом ${query.code} не существует.`);
    }
  
    return itemGroup;
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemGroupEntity) => {
    const itemGroup = await this.findOne(params);

    const newItemGroup = { ...itemGroup, ...body } as ItemGroupEntity;

    await ItemGroupEntity.save(newItemGroup);

    return itemGroup;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const itemGroup = await this.findOne(params);

    const items = await this.itemService.findMany({ itemGroupId: itemGroup.id, withDeleted: true });

    const deletedItemGroup = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);

      const deleted = new Date();

      items.forEach((value) => {
        value.deleted = deleted;
      });

      await itemRepo.save(items);
      return itemGroupRepo.softRemove(itemGroup);
    });

    return deletedItemGroup;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedItemGroup = await this.findOne(params, { withDeleted: true });

    const items = await this.itemService.findMany({ itemGroupId: deletedItemGroup.id, withDeleted: true });

    const itemGroup = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);

      items.forEach((value) => {
        value.deleted = null;
      });

      await itemRepo.save(items);
      const recoverItemGroup = await itemGroupRepo.recover(deletedItemGroup);
  
      return recoverItemGroup;
    });

    return itemGroup;
  };
}
