import { Container, Singleton } from 'typescript-ioc';

import { CompositionEntity } from '@server/db/entities/composition.entity';
import { CompositionTranslateEntity } from '@server/db/entities/composition.translate.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { ItemService } from '@server/services/item/item.service';
import type { CompositionQueryInterface } from '@server/types/composition/composition.query.interface';
import type { CompositionOptionsInterface } from '@server/types/composition/composition.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';
import { RedisKeyEnum } from '@server/types/db/enums/redis-key.enum';

@Singleton
export class CompositionService extends TranslationHelper {
  private readonly itemService = Container.get(ItemService);

  private createQueryBuilder = (query?: CompositionQueryInterface, options?: CompositionOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(CompositionEntity, 'composition')
      .select([
        'composition.id',
        'composition.deleted',
      ])
      .leftJoin('composition.translations', 'translations')
      .addSelect([
        'translations.id',
        'translations.name',
        'translations.lang',
      ])
      .orderBy('composition.id', 'DESC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.names?.length) {
      builder.andWhere('translations.name IN(:...names)', { names: query.names });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('composition.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }

    return builder;
  };

  public exist = async (query: CompositionQueryInterface, options?: CompositionOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: CompositionEntity) => {
    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name) });

    if (isExist) {
      return { code: 2 };
    }

    const composition = await this.createEntityWithTranslations(CompositionEntity, CompositionTranslateEntity, body, 'composition');

    return { code: 1, composition };
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: CompositionQueryInterface, options?: CompositionOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('composition.id = :id', { id: params.id });

    const composition = await builder.getOne();

    if (!composition) {
      throw new Error(lang === UserLangEnum.RU
        ? `Компонента с номером #${params.id} не существует.`
        : `Component with number #${params.id} does not exist.`);
    }

    return composition;
  };

  public findMany = async (query?: CompositionQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    return builder.getMany();
  };

  public updateOne = async (params: ParamsIdInterface, body: CompositionEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...composition } = await this.findOne(params, lang, { withDeleted: true });

    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name), excludeIds: [composition.id] });

    if (isExist) {
      return { code: 2 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const compositionRepo = manager.getRepository(CompositionEntity);
      const compositionTranslateRepo = manager.getRepository(CompositionTranslateEntity);

      const { translations, ...rest } = body;

      await this.syncTranslations(compositionTranslateRepo, translations, oldTranslations, composition, 'composition');

      await compositionRepo.update(params, rest);

      return this.findOne(params, lang, undefined, { manager });
    });

    const items = await this.itemService.findMany({ compositionIds: [composition.id], withDeleted: true }, { withoutCache: true, withGrades: true, fullItem: true });
    await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);

    return { code: 1, composition: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const composition = await this.findOne(params, lang);

    await composition.softRemove();

    composition.deleted = new Date();

    const items = await this.itemService.findMany({ compositionIds: [composition.id], withDeleted: true }, { withoutCache: true, withGrades: true, fullItem: true });
    await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);

    return composition;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedComposition = await this.findOne(params, lang, { withDeleted: true });

    await deletedComposition.recover();

    deletedComposition.deleted = null;

    const items = await this.itemService.findMany({ compositionIds: [deletedComposition.id], withDeleted: true }, { withoutCache: true, withGrades: true, fullItem: true });
    await this.redisService.setItems(RedisKeyEnum.ITEM_BY_ID, items);

    return deletedComposition;
  };
}
