import { renameSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

import { Container, Singleton } from 'typescript-ioc';

import { ItemEntity } from '@server/db/entities/item.entity';
import type { ItemQueryInterface } from '@server/types/item/item.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { BaseService } from '@server/services/app/base.service';
import { ImageService } from '@server/services/storage/image.service';
import { itemPath, uploadFilesItemPath, uploadFilesTempPath } from '@server/utilities/upload.path';
import { ImageEntity } from '@server/db/entities/image.entity';
import { catalogPath, routes } from '@/routes';
import { translate } from '@/utilities/translate';

@Singleton
export class ItemService extends BaseService {
  private readonly imageService = Container.get(ImageService);

  private createQueryBuilder = (query?: ItemQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemEntity, 'item')
      .select([
        'item.id',
        'item.name',
        'item.description',
        'item.deleted',
        'item.price',
        'item.height',
        'item.width',
        'item.composition',
        'item.length',
        'item.rating',
        'item.className',
      ])
      .leftJoinAndSelect('item.images', 'images')
      .leftJoinAndSelect('item.group', 'group');

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

    const fetchedImages = await this.imageService.findMany({ ids: images.map(({ id }) => id) });

    const createdItem = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const imageRepo = manager.getRepository(ImageEntity);

      const created = await itemRepo.save(body);

      if (!existsSync(uploadFilesItemPath(created.id))) {
        mkdirSync(uploadFilesItemPath(created.id));
      }

      fetchedImages.forEach((image, i) => {
        renameSync(uploadFilesTempPath(image.name), uploadFilesItemPath(created.id, image.name));
        image.path = itemPath(created.id);
        image.item = created;
        image.order = i;
      });
      await imageRepo.save(fetchedImages);

      return created;
    });

    const url = path.join(routes.homePage, catalogPath.slice(1), createdItem.group.code, translate(createdItem.name));

    const item = await this.findOne({ id: createdItem.id });

    return { code: 1, item, url };
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemEntity) => {
    const item = await this.findOne(params);

    const newItem = { ...item, ...body } as ItemEntity;
      
    await ItemEntity.update(body.id, newItem);

    return newItem;
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
}
