import { Singleton } from 'typescript-ioc';

import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';
import { BaseService } from '@server/services/app/base.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { DeferredPublicationOptionsInterface } from '@server/types/deferred-publication/deferred-publication.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class DeferredPublicationService extends BaseService {

  private createQueryBuilder = (options?: DeferredPublicationOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(DeferredPublicationEntity, 'deferredPublication')
      .select([
        'deferredPublication.id',
        'deferredPublication.deleted',
        'deferredPublication.date',
        'deferredPublication.isPublished',
      ])
      .leftJoin('deferredPublication.item', 'item')
      .addSelect([
        'item.id',
        'item.translateName',
      ])
      .leftJoin('item.translations', 'translations')
      .addSelect([
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
      .leftJoin('item.group', 'group')
      .addSelect('group.code')
      .orderBy('deferredPublication.date', 'ASC');

    if (options?.withDeleted) {
      builder.withDeleted();
    }
    if (options?.onlyNotPublished) {
      builder.andWhere('NOT deferredPublication.isPublished');
    }
    if (options?.id) {
      builder.andWhere('deferredPublication.id = :id', { id: options.id });
    }

    return builder;
  };

  public createOne = async (body: DeferredPublicationEntity, lang: UserLangEnum) => {
    const created = await DeferredPublicationEntity.save(body);

    const deferredPublication = await this.findOne({ id: created.id }, lang);

    return deferredPublication;
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, options?: DeferredPublicationOptionsInterface) => {
    const builder = this.createQueryBuilder({ ...options, ...params });

    const deferredPublication = await builder.getOne();

    if (!deferredPublication) {
      throw new Error(lang === UserLangEnum.RU
        ? `Отложенной публикации с номером #${params.id} не существует.`
        : `Deferred publication with number #${params.id} does not exist.`);
    }

    return deferredPublication;
  };

  public findMany = async (options?: DeferredPublicationOptionsInterface) => {
    const builder = this.createQueryBuilder({ ...options, onlyNotPublished: true });

    return builder.getMany();
  };

  public updateOne = async (params: ParamsIdInterface, body: DeferredPublicationEntity, lang: UserLangEnum) => {
    const deferredPublication = await this.findOne(params, lang, { withDeleted: true });

    await DeferredPublicationEntity.update(params, body);

    const updated = { ...deferredPublication, ...body };

    return { code: 1, deferredPublication: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deferredPublication = await this.findOne(params, lang);

    await deferredPublication.softRemove();

    deferredPublication.deleted = new Date();

    return deferredPublication;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedDeferredPublication = await this.findOne(params, lang, { withDeleted: true });

    return deletedDeferredPublication.recover();
  };
}
