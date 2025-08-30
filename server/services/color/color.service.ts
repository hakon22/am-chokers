import { Singleton } from 'typescript-ioc';

import { ColorEntity } from '@server/db/entities/color.entity';
import { ColorTranslateEntity } from '@server/db/entities/color.translate.entity';
import { TranslationHelper } from '@server/utilities/translation.helper';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ColorQueryInterface } from '@server/types/color/color.query.interface';
import type { ColorOptionsInterface } from '@server/types/color/color.options.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class ColorService extends TranslationHelper {

  private createQueryBuilder = (query?: ColorQueryInterface, options?: ColorOptionsInterface) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ColorEntity, 'color')
      .select([
        'color.id',
        'color.hex',
        'color.deleted',
      ])
      .leftJoin('color.translations', 'translations')
      .addSelect([
        'translations.id',
        'translations.name',
        'translations.lang',
      ])
      .orderBy('color.id', 'DESC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.names?.length) {
      builder.andWhere('translations.name IN(:...names)', { names: query.names });
    }
    if (query?.hex) {
      builder.andWhere('color.hex = :hex', { hex: query.hex });
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('color.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }

    return builder;
  };

  public exist = async (query: ColorQueryInterface, options?: ColorOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options).withDeleted();

    const isExist = await builder.getExists();

    return isExist;
  };

  public createOne = async (body: ColorEntity) => {
    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name) });

    if (isExist) {
      return { code: 2 };
    }

    const color = await this.createEntityWithTranslations(ColorEntity, ColorTranslateEntity, body, 'color');

    return { code: 1, color };
  };

  public findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: ColorQueryInterface, options?: ColorOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options)
      .andWhere('color.id = :id', { id: params.id });

    const color = await builder.getOne();

    if (!color) {
      throw new Error(lang === UserLangEnum.RU
        ? `Цвета с номером #${params.id} не существует.`
        : `Color with number #${params.id} does not exist.`);
    }

    return color;
  };

  public findMany = async (query?: ColorQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    return builder.getMany();
  };

  public updateOne = async (params: ParamsIdInterface, body: ColorEntity, lang: UserLangEnum) => {
    const { translations: oldTranslations, ...color } = await this.findOne(params, lang, { withDeleted: true });

    const isExist = await this.exist({ names: body.translations.map((translation) => translation.name), excludeIds: [color.id] });

    if (isExist) {
      return { code: 2 };
    }

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const colorRepo = manager.getRepository(ColorEntity);
      const colorTranslateRepo = manager.getRepository(ColorTranslateEntity);

      const { translations, ...rest } = body;

      await this.syncTranslations(colorTranslateRepo, translations, oldTranslations, color, 'color');

      await colorRepo.update(params, rest);

      return this.findOne(params, lang, undefined, { manager });
    });

    return { code: 1, color: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const color = await this.findOne(params, lang);

    await color.softRemove();

    color.deleted = new Date();

    return color;
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const deletedColor = await this.findOne(params, lang, { withDeleted: true });

    return deletedColor.recover();
  };
}
