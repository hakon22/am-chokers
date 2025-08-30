import _ from 'lodash';
import type { EntityManager, EntityTarget, ObjectLiteral, Repository } from 'typeorm';

import { BaseService } from '@server/services/app/base.service';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

interface TranslatableEntity {
  id?: number;
  lang: UserLangEnum;
}

interface BaseEntity {
  id?: number;
  translations: TranslatableEntity[];
}

type ParentFieldType = 'collection' | 'group' | 'item' | 'color' | 'deliveryCredentials' | 'composition';

export class TranslationHelper extends BaseService {
  /**
  * Универсальная функция для синхронизации переводов сущностей TypeORM
  * @param entityRepo - репозиторий для сохранения переводов
  * @param translations - новые переводы
  * @param oldTranslations - существующие переводы
  * @param parentEntity - родительская сущность
  * @param parentFieldName - название поля связи с родителем
  */
  protected syncTranslations = async <T extends TranslatableEntity>(
    entityRepo: Repository<T>,
    translations: T[],
    oldTranslations: T[],
    parentEntity: ObjectLiteral,
    parentFieldName: ParentFieldType,
  ) => {
    for (const language of Object.values(UserLangEnum)) {
      const oldTranslate = oldTranslations.find((translation) => translation.lang === language);
      const newTranslate = translations.find((translation) => translation.lang === language);

      if (newTranslate && !_.isEqual(oldTranslate, newTranslate)) {
        if (oldTranslate) {
          newTranslate.id = oldTranslate.id;
        }
        (newTranslate as any)[parentFieldName] = parentEntity;

        await entityRepo.save(newTranslate);
      }
    }
  };

  /**
  * Универсальная функция для создания сущности TypeORM с переводами
  * @param entityRepo - родительский репозиторий для сохранения сущности
  * @param translationRepo - репозиторий для сохранения переводов
  * @param translations - новые переводы
  * @param parentFieldName - название поля связи с родителем
  */
  protected createEntityWithTranslations = async <T extends BaseEntity>(
    entity: EntityTarget<ObjectLiteral>,
    translationEntity: EntityTarget<ObjectLiteral>,
    body: T,
    parentFieldName: ParentFieldType,
    entityManager?: EntityManager,
  ) => {
    const { translations, ...rest } = body;

    if (entityManager) {
      const entityRepo = entityManager.getRepository(entity);
      const translationRepo = entityManager.getRepository(translationEntity);

      const created = await entityRepo.save(rest as T);
      created.translations = await translationRepo.save(translations.map((translation) => ({ ...translation, [parentFieldName]: { id: created.id } })));

      return created;
    } else {
      return this.databaseService.getManager().transaction(async (manager) => {
        const entityRepo = manager.getRepository(entity);
        const translationRepo = manager.getRepository(translationEntity);

        const created = await entityRepo.save(rest as T);
        created.translations = await translationRepo.save(translations.map((translation) => ({ ...translation, [parentFieldName]: { id: created.id } })));

        return created;
      });
    }
  };
}
