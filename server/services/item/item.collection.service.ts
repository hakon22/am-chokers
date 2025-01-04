import { Container, Singleton } from 'typescript-ioc';

import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import type { ItemCollectionQueryInterface } from '@server/types/item/item.collection.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import { ItemService } from '@server/services/item/item.service';
import { ItemEntity } from '@server/db/entities/item.entity';

@Singleton
export class ItemCollectionService extends BaseService {
  private readonly itemService = Container.get(ItemService);

  private createQueryBuilder = (query?: ItemCollectionQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemCollectionEntity, 'itemCollection')
      .cache(true)
      .select([
        'itemCollection.id',
        'itemCollection.name',
        'itemCollection.description',
        'itemCollection.deleted',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.name) {
      builder.andWhere('itemCollection.name = :name', { name: query.name });
    }

    return builder;
  };

  public exist = async (query: ItemCollectionQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ItemCollectionEntity) => {
    const isExist = await this.exist({ name: body.name });

    if (isExist) {
      return { code: 2 };
    }

    const itemCollection = await ItemCollectionEntity.save(body);

    return { code: 1, itemCollection };
  };

  public findOne = async (params: ParamsIdInterface, query?: ItemCollectionQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('itemCollection.id = :id', { id: params.id });

    const itemCollection = await builder.getOne();

    if (!itemCollection) {
      throw new Error(`Коллекции товаров с номером #${params.id} не существует.`);
    }

    return itemCollection;
  };

  public findMany = async (query?: ItemCollectionQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const itemCollections = await builder.getMany();

    return itemCollections;
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemCollectionEntity) => {
    const itemCollection = await this.findOne(params);

    const newItemCollection = { ...itemCollection, ...body } as ItemCollectionEntity;
      
    await ItemCollectionEntity.save(newItemCollection);

    return itemCollection;
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const itemCollection = await this.findOne(params);

    const items = await this.itemService.findMany({ itemCollectionId: itemCollection.id, withDeleted: true });
    const updatedItems = items.map((item) => ({ ...item, collection: undefined }));

    const deletedItemCollection = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemCollectionRepo = manager.getRepository(ItemCollectionEntity);

      await itemRepo.save(updatedItems);
      return itemCollectionRepo.softRemove(itemCollection);
    });

    return deletedItemCollection;
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedItemCollection = await this.findOne(params, { withDeleted: true });

    const itemCollection = await deletedItemCollection.recover();

    return itemCollection;
  };
}
