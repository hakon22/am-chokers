import { Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AiTryOnLogEntity } from '@server/db/entities/ai/ai-try-on-log.entity';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

@Singleton
export class TryOnReportService extends BaseService {
  /**
   * Админ-реестр успешных AI-примерок с товаром и оценкой
   * @param query - limit/offset пагинации
   * @returns [items, count]
   */
  public tryOnReport = async (query: PaginationQueryInterface): Promise<[AiTryOnLogEntity[], number]> => {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;

    return this.databaseService.getManager()
      .createQueryBuilder(AiTryOnLogEntity, 'log')
      .select([
        'log.id',
        'log.created',
        'log.totalCost',
        'log.userRating',
        'log.resultImagePath',
        'log.resultImageName',
      ])
      .leftJoin('log.item', 'item')
      .addSelect([
        'item.id',
        'item.translateName',
      ])
      .leftJoin('item.group', 'itemGroup')
      .addSelect([
        'itemGroup.id',
        'itemGroup.code',
      ])
      .leftJoin('item.translations', 'itemTranslations')
      .addSelect([
        'itemTranslations.lang',
        'itemTranslations.name',
      ])
      .leftJoin('item.images', 'itemImages', 'itemImages.deleted IS NULL')
      .addSelect([
        'itemImages.id',
        'itemImages.name',
        'itemImages.path',
        'itemImages.order',
      ])
      .where('log.status = :status', { status: AiTryOnLogStatusEnum.SUCCESS })
      .andWhere('log.resultImageName IS NOT NULL')
      .orderBy('log.created', 'DESC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();
  };
}
