import { renameSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { ItemEntity } from '@server/db/entities/item.entity';
import type { ItemQueryInterface } from '@server/types/item/item.query.interface';
import { BaseService } from '@server/services/app/base.service';
import { newItemValidation } from '@/validations/validations';
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
    if (query?.id) {
      builder.andWhere('item.id = :id', { id: query.id });
    }
    if (query?.name) {
      builder.andWhere('item.name = :name', { name: query.name });
    }

    return builder;
  };

  private find = async (query: ItemQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const item = await builder.getOne();

    if (!item) {
      throw new Error(`Товара с номером #${query.id} не существует.`);
    }

    return item;
  };

  private exist = async (query: ItemQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const isExist = await builder.withDeleted().getExists();

    return isExist;
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const item = await this.find(query);

      res.json({ code: 1, item });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const builder = this.createQueryBuilder();

      const items = await builder.getMany();

      res.json({ code: 1, items });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const { images, ...reqItem } = req.body as ItemEntity;
      await newItemValidation.serverValidator({ ...reqItem });

      const isExist = await this.exist({ name: reqItem.name });

      if (isExist) {
        res.json({ code: 2 });
        return;
      }

      const fetchedImages = await this.imageService.findMany({ ids: images.map(({ id }) => id) });

      const createdItem = await this.databaseService.getManager().transaction(async (manager) => {
        const itemRepo = manager.getRepository(ItemEntity);
        const imageRepo = manager.getRepository(ImageEntity);

        const created = await itemRepo.save(reqItem as ItemEntity);

        if (!existsSync(uploadFilesItemPath(created.id))) {
          mkdirSync(uploadFilesItemPath(created.id));
        }

        fetchedImages.forEach((image) => {
          renameSync(uploadFilesTempPath(image.name), uploadFilesItemPath(created.id, image.name));
          image.path = itemPath(created.id);
          image.item = created;
        });
        await imageRepo.save(fetchedImages);

        return created;
      });

      const url = path.join(routes.homePage, catalogPath.slice(1), createdItem.group.code, translate(createdItem.name));

      const item = await this.find({ id: createdItem.id });

      res.json({ code: 1, item, url });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const body = req.body as ItemEntity;

      const item = await this.find({ id: body.id });

      const updatedItem = { ...item, ...body };
      
      await ItemEntity.update(item.id, updatedItem);

      res.json({ code: 1, item: updatedItem });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const item = await this.find(query);

      await item.softRemove();

      res.json({ code: 1, id: item.id });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const query = req.params;

      const deletedItem = await this.find(query);

      const item = await deletedItem.recover();

      res.json({ code: 1, item });
    } catch (e) {
      this.loggerService.error(e);
      res.sendStatus(500);
    }
  };
}
