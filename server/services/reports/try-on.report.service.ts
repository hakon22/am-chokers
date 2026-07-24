import { Singleton } from 'typescript-ioc';
import _ from 'lodash';
import type { SelectQueryBuilder } from 'typeorm';

import { BaseService } from '@server/services/app/base.service';
import { AiTryOnLogEntity } from '@server/db/entities/ai/ai-try-on-log.entity';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import { TryOnReportSortFieldEnum } from '@server/types/reports/try-on/enums/try-on-report-sort-field.enum';
import type { TryOnReportQueryInterface } from '@server/types/reports/try-on/try-on-report-query.interface';

@Singleton
export class TryOnReportService extends BaseService {
  /**
   * Применяет ORDER BY для реестра AI-примерки
   * @param builder - query builder выборки логов
   * @param sortField - поле сортировки из query
   * @param sortOrder - направление сортировки из query
   */
  private applyTryOnReportSortOrder = (
    builder: SelectQueryBuilder<AiTryOnLogEntity>,
    sortField?: TryOnReportSortFieldEnum,
    sortOrder?: TryOnReportQueryInterface['sortOrder'],
  ): void => {
    if (_.isNil(sortOrder)) {
      builder.orderBy('log.id', 'DESC');
      return;
    }

    const direction = this.sqlHelpersService.getSqlSortDirection(sortOrder);

    switch (sortField) {
    case TryOnReportSortFieldEnum.CREATED:
      builder
        .orderBy('log.created', direction)
        .addOrderBy('log.id', 'DESC');
      break;
    case TryOnReportSortFieldEnum.DURATION_MS:
      builder
        .orderBy('log.duration_ms', direction, 'NULLS LAST')
        .addOrderBy('log.id', 'DESC');
      break;
    case TryOnReportSortFieldEnum.TOTAL_COST:
      builder
        .orderBy('log.total_cost', direction, 'NULLS LAST')
        .addOrderBy('log.id', 'DESC');
      break;
    case TryOnReportSortFieldEnum.USER_RATING:
      builder
        .orderBy('log.user_rating', direction, 'NULLS LAST')
        .addOrderBy('log.id', 'DESC');
      break;
    default:
      builder.orderBy('log.id', 'DESC');
    }
  };

  /**
   * Админ-реестр успешных AI-примерок с товаром и оценкой
   * @param query - limit/offset пагинации и сортировка
   * @returns [items, count]
   */
  public tryOnReport = async (query: TryOnReportQueryInterface): Promise<[AiTryOnLogEntity[], number]> => {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const { sortField, sortOrder } = query;

    const manager = this.databaseService.getManager();

    const idQueryBuilder = manager
      .createQueryBuilder(AiTryOnLogEntity, 'log')
      .select('log.id')
      .where('log.status = :status', { status: AiTryOnLogStatusEnum.SUCCESS })
      .andWhere('log.resultImageName IS NOT NULL');

    this.applyTryOnReportSortOrder(idQueryBuilder, sortField, sortOrder);

    const [logIds, count] = await idQueryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    if (_.isEmpty(logIds)) {
      return [[], count];
    }

    const itemsQueryBuilder = manager
      .createQueryBuilder(AiTryOnLogEntity, 'log')
      .select([
        'log.id',
        'log.created',
        'log.durationMs',
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
      .where('log.id IN (:...ids)', { ids: logIds.map(({ id }) => id) });

    this.applyTryOnReportSortOrder(itemsQueryBuilder, sortField, sortOrder);

    const items = await itemsQueryBuilder
      .addOrderBy('itemImages.order', 'ASC')
      .getMany();

    return [items, count];
  };
}
