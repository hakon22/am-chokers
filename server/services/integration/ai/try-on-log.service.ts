import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { DeepPartial, EntityManager } from 'typeorm';

import { BaseService } from '@server/services/app/base.service';
import { AiTryOnLogEntity } from '@server/db/entities/ai/ai-try-on-log.entity';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

interface CreateLogEntryOptionsInterface {
  manager?: EntityManager;
}

export type TryOnRatingResultType =
  | { code: 1; }
  | { code: 3; message: string; };

@Singleton
export class TryOnLogService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  /**
   * Создаёт запись журнала примерки
   * @param params - поля сущности лога
   * @param options - опциональный EntityManager транзакции
   * @returns сохранённая сущность
   */
  public createLogEntry = async (params: DeepPartial<AiTryOnLogEntity>, options?: CreateLogEntryOptionsInterface): Promise<AiTryOnLogEntity> => {
    const manager = options?.manager || this.databaseService.getManager();
    const { validationCost, generationCost, resultImageName } = params;

    const totalCost = !_.isNil(params.totalCost)
      ? params.totalCost
      : (!_.isNil(validationCost) || !_.isNil(generationCost)
        ? Number(validationCost ?? 0) + Number(generationCost ?? 0)
        : null);

    const resolvedResultImageName = resultImageName ?? null;
    const resultImagePath = params.resultImagePath
      ?? (resolvedResultImageName ? this.uploadPathService.getUrlPath(UploadPathEnum.TRY_ON) : null);

    const log = manager.create(AiTryOnLogEntity, {
      ...params,
      totalCost,
      resultImageName: resolvedResultImageName,
      resultImagePath,
    });

    return manager.save(log);
  };

  /**
   * Ставит оценку пользователя, если ещё не оценено
   * @param tryOnLogId - id лога
   * @param rating - GOOD / BAD
   * @param lang - язык сообщения об ошибке
   * @param options - опциональный EntityManager транзакции
   * @returns code 1 при успехе или code 3 с локализованным message
   */
  public setUserRating = async (
    tryOnLogId: number,
    rating: AiTryOnUserRatingEnum,
    lang: UserLangEnum,
    options?: CreateLogEntryOptionsInterface,
  ): Promise<TryOnRatingResultType> => {
    const manager = options?.manager || this.databaseService.getManager();
    const isEnglish = lang === UserLangEnum.EN;
    const log = await manager.findOne(AiTryOnLogEntity, {
      where: { id: tryOnLogId },
    });

    if (_.isNil(log)) {
      return {
        code: 3,
        message: isEnglish ? 'Try-on log not found' : 'Запись примерки не найдена',
      };
    }

    if (log.status !== AiTryOnLogStatusEnum.SUCCESS) {
      return {
        code: 3,
        message: isEnglish
          ? 'Only successful try-on can be rated'
          : 'Оценить можно только успешную примерку',
      };
    }

    if (!_.isNil(log.userRating)) {
      return {
        code: 3,
        message: isEnglish ? 'Try-on already rated' : 'Примерка уже оценена',
      };
    }

    log.userRating = rating;
    log.userRatedAt = new Date();
    await manager.save(log);

    return { code: 1 };
  };
}
