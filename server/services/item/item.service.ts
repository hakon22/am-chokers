import path from 'path';

import { Container, Singleton } from 'typescript-ioc';
import { Brackets } from 'typeorm';
import ExcelJS, { type Anchor } from 'exceljs';
import moment from 'moment';

import { ItemEntity } from '@server/db/entities/item.entity';
import { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { TelegramService } from '@server/services/integration/telegram.service';
import { ImageService } from '@server/services/storage/image.service';
import { GradeService } from '@server/services/rating/grade.service';
import { ImageEntity } from '@server/db/entities/image.entity';
import { catalogPath, routes } from '@/routes';
import { translate } from '@/utilities/translate';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemQueryInterface } from '@server/types/item/item.query.interface';
import type { ItemOptionsInterface } from '@server/types/item/item.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { FetchItemInterface } from '@/types/item/Item';

@Singleton
export class ItemService extends TranslationHelper {
  private readonly imageService = Container.get(ImageService);

  private readonly gradeService = Container.get(GradeService);

  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly telegramService = Container.get(TelegramService);

  private createQueryBuilder = (query?: ItemQueryInterface, options?: ItemOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ItemEntity, 'item');

    if (options?.onlyIds) {
      builder
        .select('item.id')
        .distinct(true);

      if (query?.sort) {
        switch (query.sort) {
        case ItemSortEnum.BY_RATING:
          builder
            .leftJoin('item.rating', 'rating')
            .addSelect('rating.rating')
            .orderBy('rating.rating', 'ASC');
          break;
        case ItemSortEnum.BY_OVER_PRICE:
          builder
            .addSelect('(item.price - item.discountPrice)', 'diff_price')
            .orderBy('diff_price', 'DESC');
          break;
        case ItemSortEnum.BY_LOWER_PRICE:
          builder
            .addSelect('(item.price - item.discountPrice)', 'diff_price')
            .orderBy('diff_price', 'ASC');
          break;
        }
      } else {
        builder.orderBy('item.id', 'DESC');
      }

      if (query?.collectionIds?.length) {
        builder.leftJoin('item.collection', 'collection');
      }
      if (query?.compositionIds?.length) {
        builder.leftJoin('item.compositions', 'compositions');
      }
      if (query?.colorIds?.length) {
        builder.leftJoin('item.colors', 'colors');
      }
      if (query?.groupIds?.length || query?.groupCode) {
        builder.leftJoin('item.group', 'group');
      }
      if (query?.limit || query?.offset) {
        builder
          .limit(query.limit)
          .offset(query.offset);
      }
      if (query?.search) {
        builder
          .setParameter('search', `%${query.search.trim()}%`)
          .leftJoin('item.translations', 'translations')
          .andWhere(new Brackets((qb) => {
            qb
              .orWhere('translations.name ILIKE :search')
              .orWhere('translations.description ILIKE :search');
          }));
      }
    } else {
      builder
        .select([
          'item.id',
          'item.created',
          'item.deleted',
          'item.price',
          'item.discount',
          'item.discountPrice',
          'item.new',
          'item.bestseller',
          'item.order',
          'item.translateName',
        ])
        .leftJoin('item.translations', 'translations')
        .addSelect([
          'translations.id',
          'translations.name',
          'translations.description',
          'translations.length',
          'translations.lang',
        ])
        .leftJoin('item.images', 'images', 'images.deleted IS NULL')
        .addSelect([
          'images.id',
          'images.name',
          'images.path',
          'images.order',
          'images.deleted',
        ])
        .leftJoin('item.rating', 'rating')
        .addSelect([
          'rating.rating',
        ])
        .leftJoin('item.message', 'message')
        .addSelect([
          'message.id',
          'message.created',
          'message.send',
        ])
        .leftJoinAndSelect('item.group', 'group')
        .leftJoin('group.translations', 'groupTranslations')
        .addSelect([
          'groupTranslations.name',
          'groupTranslations.description',
          'groupTranslations.lang',
        ])
        .leftJoinAndSelect('item.collection', 'collection')
        .leftJoin('collection.translations', 'collectionTranslations')
        .addSelect([
          'collectionTranslations.name',
          'collectionTranslations.lang',
        ])
        .leftJoinAndSelect('item.compositions', 'compositions')
        .leftJoin('compositions.translations', 'compositionsTranslations')
        .addSelect([
          'compositionsTranslations.name',
          'compositionsTranslations.lang',
        ])
        .leftJoinAndSelect('item.colors', 'colors')
        .leftJoin('colors.translations', 'colorsTranslations')
        .addSelect([
          'colorsTranslations.name',
          'colorsTranslations.lang',
        ])
        .addOrderBy('item.deleted IS NOT NULL', 'ASC');
    }

    if (query?.sort) {
      switch (query.sort) {
      case ItemSortEnum.BY_RATING:
        builder.orderBy('rating.rating', 'ASC');
        break;
      case ItemSortEnum.BY_OVER_PRICE:
        builder.orderBy('(item.price - item.discountPrice)', 'DESC');
        break;
      case ItemSortEnum.BY_LOWER_PRICE:
        builder.orderBy('(item.price - item.discountPrice)', 'ASC');
        break;
      }
    } else {
      builder.orderBy('item.id', 'DESC');
    }

    if (query?.withDeleted) {
      builder.andWhere(new Brackets((qb) => {
        qb
          .andWhere('item.deleted IS NOT NULL')
          .orWhere('item.deleted IS NULL');
      }));
    } else {
      builder.andWhere('item.deleted IS NULL');
    }
    if (query?.id) {
      builder.andWhere('item.id = :id', { id: query.id });
    }
    if (query?.names?.length) {
      builder.andWhere('translations.name IN(:...names)', { names: query.names });
    }
    if (query?.translateName) {
      builder.andWhere('item.translateName = :translateName', { translateName: query.translateName });
    }
    if (query?.itemGroupId) {
      builder.andWhere('group.id = :itemGroupId', { itemGroupId: query.itemGroupId });
    }
    if (query?.collectionIds?.length) {
      builder.andWhere('collection.id IN(:...collectionIds)', { collectionIds: query.collectionIds });
    }
    if (query?.compositionIds?.length) {
      builder.andWhere('compositions.id IN(:...compositionIds)', { compositionIds: query.compositionIds });
    }
    if (query?.colorIds?.length) {
      builder.andWhere('colors.id IN(:...colorIds)', { colorIds: query.colorIds });
    }
    if (query?.groupIds) {
      builder.andWhere('group.id IN(:...groupIds)', { groupIds: query.groupIds });
    }
    if (query?.from) {
      builder.andWhere('(item.price - item.discountPrice) >= :from', { from: query.from });
    }
    if (query?.to) {
      builder.andWhere('(item.price - item.discountPrice) <= :to', { to: query.to });
    }
    if (query?.new) {
      builder.andWhere('item.new = TRUE');
    }
    if (query?.bestseller) {
      builder.andWhere('item.bestseller = TRUE');
    }
    if (query?.groupCode) {
      builder.andWhere('group.code = :groupCode', { groupCode: query.groupCode });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('item.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }
    if (options?.ids?.length) {
      builder.andWhere('item.id IN(:...ids)', { ids: options.ids });
    }
    if (options?.withGrades) {
      builder
        .leftJoin('item.grades', 'grades', 'grades.checked = true')
        .addSelect('grades.id');
    }

    return builder;
  };

  public exist = async (query: ItemQueryInterface, options?: ItemOptionsInterface) => {
    const builder = this.createQueryBuilder({ ...query, withDeleted: true }, options);

    const isExist = await builder.getExists();

    return isExist;
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: ItemQueryInterface, options?: ItemOptionsInterface) => {
    const builder = this.createQueryBuilder({ ...query, id: params.id }, options);

    const item = await builder.getOne();

    if (!item) {
      throw new Error(lang === UserLangEnum.RU
        ? `Товара с номером #${params.id} не существует.`
        : `Item with number #${params.id} does not exist.`);
    }

    return item;
  };

  public findMany = async (query?: ItemQueryInterface, options?: ItemOptionsInterface) => {
    const builder = this.createQueryBuilder({ ...query, withDeleted: true }, options);

    return builder.getMany();
  };

  public search = async (query: Pick<ItemQueryInterface, 'search' | 'withDeleted'>) => {
    const builder = this.createQueryBuilder(query);

    return builder.getMany();
  };

  public getList = async (query: FetchItemInterface): Promise<[ItemEntity[], number]> => {
    const idsBuilder = this.createQueryBuilder(query, { ...query, onlyIds: true });

    const [ids, count] = await idsBuilder.getManyAndCount();

    let items: ItemEntity[] = [];

    if (ids.length) {
      const builder = this.createQueryBuilder(query, { withGrades: true, ids: ids.map(({ id }) => id) });

      items = await builder.getMany();
    }

    return [items, count];
  };

  public createOne = async (body: ItemEntity, images: ImageEntity[], lang: UserLangEnum) => {
    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name) });

    if (isExist) {
      return { code: 2 };
    }

    body.translateName = translate(body.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name);

    const item = await this.databaseService.getManager().transaction(async (manager) => {
      const created = await this.createEntityWithTranslations(ItemEntity, ItemTranslateEntity, body, 'item', manager);

      this.uploadPathService.checkFolder(UploadPathEnum.ITEM, created.id);

      await this.imageService.processingImages(images, UploadPathEnum.ITEM, created.id, manager);

      return this.findOne({ id: created.id }, lang, undefined, { manager });
    });

    const url = this.getUrl(item);

    this.uploadPathService.createSitemap(url);

    return { code: 1, item, url };
  };

  public updateOne = async (params: ParamsIdInterface, body: ItemEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...item } = await this.findOne(params, lang, { withDeleted: true });

    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name), excludeIds: [item.id] });

    if (isExist) {
      return { code: 2 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemTranslateRepo = manager.getRepository(ItemTranslateEntity);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { grades, translations, ...rest } = body;

      const oldNameRu = oldTranslations.find((translation) => translation.lang === UserLangEnum.RU)?.name;
      const newNameRu = translations.find((translation) => translation.lang === UserLangEnum.RU)?.name;

      if (oldNameRu !== newNameRu) {
        rest.translateName = translate(newNameRu);
      }

      await this.syncTranslations(itemTranslateRepo, translations, oldTranslations, item, 'item');

      await itemRepo.save(rest);

      await this.imageService.processingImages(body.images, UploadPathEnum.ITEM, rest.id, manager);

      return this.findOne(params, lang, undefined, { manager });
    });

    const [grades] = await this.getGrades(params, { limit: 10, offset: 0 });
    updated.grades = grades;

    const url = this.getUrl(updated);

    if ((updated.group.code !== item.group.code) || (updated.translateName !== item.translateName)) {
      const oldUrl = this.getUrl(item);

      this.uploadPathService.updateSitemap(oldUrl, url);
    }

    return { code: 1, item: updated, url };
  };

  public partialUpdateOne = async (params: ParamsIdInterface, body: ItemEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...item } = await this.findOne(params, lang, { withDeleted: true });

    if (body.translations && body.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name !== oldTranslations.find((translation) => translation.lang === UserLangEnum.RU)?.name) {
      const isExist = await this.exist({ names: body.translations.map((translation) => translation.name), excludeIds: [item.id] });

      if (isExist) {
        return { code: 2 };
      }
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const itemRepo = manager.getRepository(ItemEntity);
      const itemTranslateRepo = manager.getRepository(ItemTranslateEntity);

      if (body.translations?.length) {
        const oldNameRu = oldTranslations.find((translation) => translation.lang === UserLangEnum.RU)?.name;
        const newNameRu = body.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name;

        if (oldNameRu !== newNameRu) {
          body.translateName = translate(newNameRu);
        }

        await this.syncTranslations(itemTranslateRepo, body.translations, oldTranslations, item, 'item');
      }

      await itemRepo.update(params, body);

      await this.imageService.processingImages(body.images, UploadPathEnum.ITEM, item.id, manager);

      return this.findOne(params, lang, undefined, { manager });
    });

    const [grades] = await this.getGrades(params, { limit: 10, offset: 0 });
    updated.grades = grades;

    const url = this.getUrl(updated);

    if ((updated.group.code !== item.group.code) || (updated.translateName !== item.translateName)) {
      const oldUrl = this.getUrl(item);

      this.uploadPathService.updateSitemap(oldUrl, url);
    }

    return { code: 1, item: updated, url };
  };

  public publishToTelegram = async (params: ParamsIdInterface, lang: UserLangEnum, description?: string, value?: ItemEntity) => {
    const isRu = lang === UserLangEnum.RU;

    if (!process.env.TELEGRAM_GROUP_ID) {
      throw new Error(isRu
        ? 'Не указана группа для отправки в Telegram'
        : 'No group specified for sending to Telegram');
    }

    const item = value || await this.findOne(params, lang);

    if (item.images.length < 2) {
      throw new Error(isRu
        ? 'Для публикации в группу Telegram товар должен иметь более одной фотографии'
        : 'To be published in a Telegram group, a item must have more than one photo');
    }

    if (item.message?.send) {
      throw new Error(isRu
        ? 'Товар уже опубликован!'
        : 'The item has already been published!');
    }

    const url = this.getUrl(item);

    const values: string[] = (description || item.translations.find((translation) => translation.lang === UserLangEnum.RU)?.description as string).split('\n');

    const text = [
      ...values,
      '',
      ...(item?.collection ? [`Коллекция: <b>${item.collection.translations.find((translation) => translation.lang === UserLangEnum.RU)?.name}</b>`] : []),
      `Цена: <b>${item.price - item.discountPrice} ₽</b>`,
      '',
      `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}`,
    ];

    const message = await this.telegramService.sendMessageWithPhotos(text, item.images.map(({ src }) => `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${src}`), process.env.TELEGRAM_GROUP_ID);

    if (message?.history) {
      await ItemEntity.update(item.id, { message: message.history });
      item.message = message.history;
    }

    return item;
  };

  public getLinks = async () => {
    const manager = this.databaseService.getManager();

    const itemBuilder = manager.createQueryBuilder(ItemEntity, 'item')
      .select('item.translateName');

    const itemGroupBuilder = manager.createQueryBuilder(ItemGroupEntity, 'itemGroup')
      .select('itemGroup.code');

    const [items, itemGroups] = await Promise.all([
      itemBuilder.getMany(),
      itemGroupBuilder.getMany(),
    ]);

    const links = new Set<string>();

    items.forEach(({ translateName }) => links.add(translateName));
    itemGroups.forEach(({ code }) => links.add(code));

    return [...links];
  };

  public getSpecials = async (isAdmin: boolean, isFull?: boolean) => {
    const builder = this.createQueryBuilder({}, { withGrades: true })
      .andWhere(new Brackets(qb => {
        qb
          .orWhere('item.new')
          .orWhere(new Brackets(qb2 => {
            qb2.andWhere('item.bestseller');
            if (!isAdmin || (isAdmin && !isFull)) {
              qb2.andWhere('item.order IS NOT NULL');
            }
          }))
          .orWhere(new Brackets(qb3 => {
            qb3.andWhere('item.collection IS NOT NULL');
            if (!isAdmin || (isAdmin && !isFull)) {
              qb3.andWhere('item.order IS NOT NULL');
            }
          }));
      }));

    return builder.getMany();
  };

  public getByName = async (query: ItemQueryInterface, lang: UserLangEnum) => {
    const builder = this.createQueryBuilder({ ...query, withDeleted: true });

    const item = await builder.getOne();

    if (!item) {
      throw new Error(lang === UserLangEnum.RU
        ? `Товара с именем ${query.translateName} не существует.`
        : `There is no item named ${query.translateName}.`);
    }

    let collectionItems: ItemEntity[] = [];

    if (item.collection) {
      const itemCollectionBuilder = this.createQueryBuilder({ collectionIds: [item.collection.id], excludeIds: [item.id] }, { withGrades: true });
      collectionItems = await itemCollectionBuilder.getMany();
    }

    return { item, collectionItems };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const item = await this.findOne(params, lang, {}, { withGrades: true });

    await ItemEntity.update(item.id, { deleted: new Date() });

    item.deleted = new Date();

    const [grades] = await this.getGrades(params, { limit: 10, offset: 0 });
    item.grades = grades;

    return item;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedItem = await this.findOne(params, lang, { withDeleted: true }, { withGrades: true });

    await ItemEntity.update(deletedItem.id, { deleted: null });

    deletedItem.deleted = null;

    const [grades] = await this.getGrades(params, { limit: 10, offset: 0 });
    deletedItem.grades = grades;

    return deletedItem;
  };

  public getListExcel = async (lang: UserLangEnum) => {
    const data = await this.findMany({ withDeleted: true });

    const items = await Promise.all(data.map(async (item) => ({ ...item, image: item.images[0] ? await fetch(`${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${item.images[0].src}`).then(res => res.arrayBuffer()) : null } as ItemEntity & { image: ArrayBuffer; })));

    const { deleted, notDeleted } = items.reduce((acc, item) => {
      if (item.deleted) {
        acc.deleted.push(item);
      } else {
        acc.notDeleted.push(item);
      }
      return acc;
    }, { deleted: [], notDeleted: [] } as { deleted: (ItemEntity & { image: ArrayBuffer; })[]; notDeleted: (ItemEntity & { image: ArrayBuffer; })[]; });

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('Актуальные');
    const worksheet2 = workbook.addWorksheet('Удалённые');

    const isRu = lang === UserLangEnum.RU;

    [worksheet, worksheet2].forEach((ws) => {
      ws.columns = [
        { header: isRu ? 'Изображение' : 'Image', key: 'image', width: 20 },
        { header: isRu ? 'Номер' : 'Number', key: 'id', width: 10 },
        { header: isRu ? 'Название' : 'Name', key: 'name', width: 40 },
        { header: isRu ? 'Описание' : 'Description', key: 'description', width: 100 },
        { header: isRu ? 'Группа' : 'Group', key: 'group', width: 20 },
        { header: isRu ? 'Коллекция' : 'Collection', key: 'collection', width: 20 },
        { header: isRu ? 'Цена' : 'Price', key: 'price', width: 10 },
        { header: isRu ? 'Скидка' : 'Discount', key: 'discount', width: 10 },
        { header: isRu ? 'Длина' : 'Length', key: 'length', width: 50 },
        { header: isRu ? 'Новинка' : 'New', key: 'new', width: 15 },
        { header: isRu ? 'Бестселлер' : 'Bestseller', key: 'bestseller', width: 15 },
        { header: isRu ? 'Дата создания' : 'Created date', key: 'created', width: 20 },
      ];

      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true };
    });

    const topPadding = 12700 * 5;  // 10 пикселей сверху
    const bottomPadding = 12700 * 5; // 10 пикселей снизу

    [notDeleted, deleted].forEach((values, i) => values.forEach((item, rowIndex) => {
      const rowNumber = rowIndex + 2; // +2, т.к. первая строка — заголовки
      const ws = i ? worksheet2 : worksheet;

      const translateItem = item.translations.find((translation) => translation.lang === lang);
  
      ws.addRow({
        id: item.id,
        name: translateItem?.name,
        description: translateItem?.description,
        group: item.group.translations.find((translation) => translation.lang === lang)?.name,
        collection: item.collection?.translations.find((translation) => translation.lang === lang)?.name,
        price: item.price - item.discountPrice,
        discount: item.discountPrice,
        length: translateItem?.length,
        new: item.new ? 'Да' : 'Нет',
        bestseller: item.bestseller ? 'Да' : 'Нет',
        created: moment(item.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM),
      });

      const imageColWidth = ws.getColumn(1).width ?? 20;
      ws.getRow(rowNumber).height = imageColWidth * 1.3 * 6;

      if (item.image) {
        const imageId = workbook.addImage({
          buffer: item.image,
          extension: 'jpeg',
        });

        ws.addImage(imageId, {
          tl: { 
            col: 0,
            row: rowNumber - 1,
            nativeCol: 0,         // Физическая колонка (0 = A)
            nativeRow: rowNumber - 1, // Физическая строка
            nativeColOff: 0,      // Смещение внутри колонки (0 = начало)
            nativeRowOff: topPadding,      // Смещение внутри строки (0 = начало)
          } as Anchor,
          br: { 
            col: 1,
            row: rowNumber,
            nativeCol: 1,         // Физическая колонка (1 = B)
            nativeRow: rowNumber, // Физическая строка
            nativeColOff: 0,      // Смещение внутри колонки (0 = конец)
            nativeRowOff: -bottomPadding,      // Смещение внутри строки (0 = конец)
          } as Anchor,
        });
      }
    }));
    
    [worksheet, worksheet2].forEach((ws) => {
      ws.eachRow((row) => {
        row.eachCell((cell) => {
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: true,
          };
        });
      });
    });

    return workbook.xlsx.writeBuffer();
  };

  public getGrades = (params: ParamsIdInterface, query: PaginationQueryInterface) => this.gradeService.findManyByItem(params, query);

  private getUrl = (item: Pick<ItemEntity, 'group' | 'translateName'>) => path.join(routes.page.base.homePage, catalogPath.slice(1), item.group.code, item.translateName).replaceAll('\\', '/');
}
