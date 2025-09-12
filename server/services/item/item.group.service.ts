import path from 'path';

import { Container, Singleton } from 'typescript-ioc';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemGroupTranslateEntity } from '@server/db/entities/item.group.translate.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { ItemService } from '@server/services/item/item.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { ItemEntity } from '@server/db/entities/item.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { catalogPath, routes } from '@/routes';
import type { ItemGroupQueryInterface } from '@server/types/item/item.group.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { ItemGroupOptionsInterface } from '@server/types/item/item.group.options.interface';

@Singleton
export class ItemGroupService extends TranslationHelper {
  private readonly itemService = Container.get(ItemService);

  private readonly uploadPathService = Container.get(UploadPathService);

  private createQueryBuilder = (query?: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemGroupEntity, 'itemGroup')
      .select([
        'itemGroup.id',
        'itemGroup.code',
        'itemGroup.order',
        'itemGroup.deleted',
      ])
      .leftJoin('itemGroup.translations', 'translations')
      .addSelect([
        'translations.id',
        'translations.name',
        'translations.description',
        'translations.lang',
      ])
      .orderBy('itemGroup.order', 'ASC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.code) {
      builder.andWhere('itemGroup.code = :code', { code: query.code });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('itemGroup.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }
    if (query?.includeIds?.length) {
      builder.andWhere('itemGroup.id IN(:...includeIds)', { includeIds: query.includeIds });
    }

    return builder;
  };

  public exist = async (query: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ItemGroupEntity) => {
    const [isExist, count] = await Promise.all([
      this.exist({ code: body.code }),
      ItemGroupEntity.count({ withDeleted: true }),
    ]);

    if (isExist) {
      return { code: 2 };
    }

    body.order = count;

    const itemGroup = await this.createEntityWithTranslations(ItemGroupEntity, ItemGroupTranslateEntity, body, 'group');

    this.uploadPathService.createSitemap(this.getUrl(itemGroup), true);

    return { code: 1, itemGroup };
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: ItemGroupQueryInterface, options?: ItemGroupOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('itemGroup.id = :id', { id: params.id });

    const itemGroup = await builder.getOne();

    if (!itemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с номером #${params.id} не существует.`
        : `Item group with number #${params.id} does not exist.`);
    }

    return itemGroup;
  };

  public findMany = async (query?: ItemGroupQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    return builder.getMany();
  };

  public getByCode = async (query: ItemGroupQueryInterface, lang: UserLangEnum) => {
    const builder = this.createQueryBuilder(query);
  
    const itemGroup = await builder.getOne();
  
    if (!itemGroup) {
      throw new Error(lang === UserLangEnum.RU
        ? `Группы товаров с кодом ${query.code} не существует.`
        : `Item group with code ${query.code} does not exist.`);
    }
  
    return itemGroup;
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemGroupEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...itemGroup } = await this.findOne(params, lang, { withDeleted: true });

    const isExist = await this.exist({ code: body.code, excludeIds: [itemGroup.id] });

    if (isExist) {
      return { code: 2 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemGroupRepo = manager.getRepository(ItemGroupEntity);
      const itemGroupTranslateRepo = manager.getRepository(ItemGroupTranslateEntity);

      const { translations, ...rest } = body;

      await this.syncTranslations(itemGroupTranslateRepo, translations, oldTranslations, itemGroup, 'group');

      await itemGroupRepo.update(params, rest);

      return this.findOne(params, lang, undefined, { manager });
    });

    if (itemGroup.code !== updated.code) {
      this.uploadPathService.updateSitemap(this.getUrl(itemGroup), this.getUrl(updated), true);
    }

    return { code: 1, itemGroup: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const itemGroup = await this.findOne(params, lang);

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

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedItemGroup = await this.findOne(params, lang, { withDeleted: true });

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

  public sort = async (body: { id: number; }[], query: ItemGroupQueryInterface) => {
    const updated: Pick<ItemGroupEntity, 'id' | 'order'>[] = [];

    body.forEach(({ id }, order) => {
      updated.push({ id, order });
    });

    await ItemGroupEntity.save(updated as ItemGroupEntity[]);

    return this.findMany({ includeIds: body.map(({ id }) => id), ...query });
  };

  private getUrl = (itemGroup: Pick<ItemGroupEntity, 'code'>) => path.join(routes.page.base.homePage, catalogPath.slice(1), itemGroup.code).replaceAll('\\', '/');
}
