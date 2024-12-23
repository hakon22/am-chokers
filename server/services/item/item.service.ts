import path from 'path';

import { Container, Singleton } from 'typescript-ioc';

import { ItemEntity } from '@server/db/entities/item.entity';
import type { ItemQueryInterface } from '@server/types/item/item.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { ImageService } from '@server/services/storage/image.service';
import { ImageEntity } from '@server/db/entities/image.entity';
import { catalogPath, routes } from '@/routes';
import { translate } from '@/utilities/translate';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

@Singleton
export class ItemService extends BaseService {
  private readonly imageService = Container.get(ImageService);

  private readonly uploadPathService = Container.get(UploadPathService);

  private createQueryBuilder = (query?: ItemQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemEntity, 'item')
      .select([
        'item.id',
        'item.name',
        'item.description',
        'item.deleted',
        'item.price',
        'item.discount',
        'item.discountPrice',
        'item.height',
        'item.width',
        'item.composition',
        'item.length',
        'item.className',
        'item.new',
        'item.bestseller',
      ])
      .leftJoin('item.images', 'images')
      .addSelect([
        'images.id',
        'images.name',
        'images.path',
        'images.deleted',
      ])
      .leftJoin('item.rating', 'rating')
      .addSelect([
        'rating.rating',
      ])
      .leftJoinAndSelect('item.group', 'group')
      .leftJoinAndSelect('item.collection', 'collection');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.name) {
      builder.andWhere('item.name = :name', { name: query.name });
    }
    if (query?.itemGroupId) {
      builder.andWhere('group.id = :itemGroupId', { itemGroupId: query.itemGroupId });
    }

    return builder;
  };

  public exist = async (query: ItemQueryInterface) => {
    const builder = this.createQueryBuilder(query).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public findOne = async (params: ParamsIdInterface, query?: ItemQueryInterface) => {
    const builder = this.createQueryBuilder(query)
      .andWhere('item.id = :id', { id: params.id });

    const item = await builder.getOne();

    if (!item) {
      throw new Error(`Товара с номером #${params.id} не существует.`);
    }

    return item;
  };

  public findMany = async (query?: ItemQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const items = await builder.getMany();

    return items;
  };

  public createOne = async (body: ItemEntity, images: ImageEntity[]) => {

    const isExist = await this.exist({ name: body.name });

    if (isExist) {
      return { code: 2 };
    }

    const createdItem = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);

      const created = await itemRepo.save(body);

      this.uploadPathService.checkFolder(UploadPathEnum.ITEM, created.id);

      await this.imageService.processingImages(images, UploadPathEnum.ITEM, created.id, manager);

      return created;
    });

    const url = this.getUrl(createdItem);

    const item = await this.findOne({ id: createdItem.id });

    return { code: 1, item, url };
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemEntity) => {
    const item = await this.findOne(params);

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);

      const newItem = { ...item, ...body } as ItemEntity;

      await itemRepo.save(newItem);
      await this.imageService.processingImages(body.images, UploadPathEnum.ITEM, newItem.id, manager);

      return newItem;
    });

    const url = this.getUrl(updated);

    return { item: updated, url };
  };

  public deleteOne = async (params: ParamsIdInterface) => {
    const item = await this.findOne(params);

    return item.softRemove();
  };

  public restoreOne = async (params: ParamsIdInterface) => {
    const deletedItem = await this.findOne(params, { withDeleted: true });

    const item = await deletedItem.recover();

    return item;
  };

  private getUrl = (item: ItemEntity) => path.join(routes.homePage, catalogPath.slice(1), item.group.code, translate(item.name));
}
