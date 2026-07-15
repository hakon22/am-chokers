import { promises as fs } from 'fs';
import { join } from 'path';

import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AiAgentService } from '@server/services/integration/ai/ai-agent.service';
import { TryOnProviderRegistryService } from '@server/services/integration/ai/try-on-provider-registry.service';
import { TryOnProductImageSelectorService } from '@server/services/integration/ai/try-on-product-image-selector.service';
import { TryOnResultImageService } from '@server/services/integration/ai/try-on-result-image.service';
import { TryOnLogService, type TryOnRatingResultType } from '@server/services/integration/ai/try-on-log.service';
import { TryOnRateLimitService } from '@server/services/integration/ai/try-on-rate-limit.service';
import { TryOnUserImageService } from '@server/services/integration/ai/try-on-user-image.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { ItemService } from '@server/services/item/item.service';
import { ItemEntity } from '@server/db/entities/item.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { AiItemGroupTryOnEntity } from '@server/db/entities/ai/ai-item-group-try-on.entity';
import { AiAgentPurposeEnum } from '@server/types/ai/enums/ai-agent-purpose.enum';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';
import { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

export interface CreateTryOnParamsInterface {
  itemId: number;
  userImageSrc: string;
  lang: UserLangEnum;
  userId: number | null;
  clientIp: string;
}

export interface TryOnSuccessResultInterface {
  code: 1;
  tryOnLogId: number;
  imageSrc: string;
  imageFormat: 'jpeg';
}

export interface TryOnErrorResultInterface {
  code: 3;
  message: string;
  tryOnLogId?: number;
  httpStatus?: number;
}

export type TryOnCreateResultType = TryOnSuccessResultInterface | TryOnErrorResultInterface;

@Singleton
export class TryOnService extends BaseService {
  private readonly TAG = 'TryOnService';

  private readonly aiAgentService = Container.get(AiAgentService);

  private readonly tryOnProviderRegistryService = Container.get(TryOnProviderRegistryService);

  private readonly tryOnProductImageSelectorService = Container.get(TryOnProductImageSelectorService);

  private readonly tryOnResultImageService = Container.get(TryOnResultImageService);

  private readonly tryOnLogService = Container.get(TryOnLogService);

  private readonly tryOnRateLimitService = Container.get(TryOnRateLimitService);

  private readonly tryOnUserImageService = Container.get(TryOnUserImageService);

  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly itemService = Container.get(ItemService);

  /**
   * Запускает validation + generation примерки
   * @param params - товар, фото, язык, пользователь и IP
   * @returns результат для HTTP-слоя
   */
  public createTryOn = async (params: CreateTryOnParamsInterface): Promise<TryOnCreateResultType> => {
    const { itemId, userImageSrc, lang, userId, clientIp } = params;
    const startedAt = Date.now();
    let tempFileName: string | null = null;

    try {
      const ipHash = this.tryOnUserImageService.hashIpAddress(clientIp);

      const rateLimit = await this.tryOnRateLimitService.checkLimits(ipHash);
      if (!rateLimit.allowed) {
        const message = rateLimit.window === 'minute'
          ? (lang === UserLangEnum.EN
            ? 'Too many try-on requests. Please wait a minute.'
            : 'Слишком много запросов. Подождите минуту.')
          : (lang === UserLangEnum.EN
            ? 'Daily try-on limit reached. Please try again tomorrow.'
            : 'Достигнут суточный лимит примерок. Попробуйте завтра.');

        return { code: 3, message, httpStatus: 429 };
      }

      let item: ItemEntity;
      try {
        item = await this.itemService.findOne({ id: itemId }, lang);
      } catch (error) {
        return {
          code: 3,
          message: error instanceof Error
            ? error.message
            : (lang === UserLangEnum.EN ? 'Item not found' : 'Товар не найден'),
        };
      }

      const tryOnConfig = await this.resolveTryOnConfig(item.group?.id);
      if (_.isNil(tryOnConfig) || !tryOnConfig.isEnabled || _.isNil(tryOnConfig.vtoType)) {
        return {
          code: 3,
          message: lang === UserLangEnum.EN
            ? 'Try-on is unavailable for this item type'
            : 'Примерка недоступна для этого типа украшения',
        };
      }

      let primary: ImageEntity;
      let refs: ImageEntity[];
      try {
        ({ primary, refs } = this.tryOnProductImageSelectorService.selectProductReferenceImages(item));
      } catch {
        return {
          code: 3,
          message: lang === UserLangEnum.EN
            ? 'Try-on photo is not configured for this item'
            : 'Для этого товара не настроено фото для примерки',
        };
      }

      const { buffer: userImageBuffer, fileName } = await this.tryOnUserImageService.readTempUserImage(userImageSrc);
      tempFileName = fileName;

      const productImageAbsolutePath = this.resolveProductImageAbsolutePath(primary.src);
      const productImageBuffer = await fs.readFile(productImageAbsolutePath);
      const productRefUrls = refs.map((image) => this.buildPublicImageUrl(image.src));

      const [validationAgent, generationAgent] = await Promise.all([
        this.aiAgentService.getActiveAgentByPurpose(AiAgentPurposeEnum.TRY_ON_VALIDATION),
        this.aiAgentService.getActiveAgentByPurpose(AiAgentPurposeEnum.TRY_ON_GENERATION),
      ]);

      if (_.isNil(validationAgent) || _.isNil(generationAgent)) {
        return {
          code: 3,
          message: lang === UserLangEnum.EN
            ? 'Try-on service is temporarily unavailable'
            : 'Сервис примерки временно недоступен',
        };
      }

      const validationProvider = this.tryOnProviderRegistryService.getValidationProvider(validationAgent.provider);
      const itemName = this.resolveItemName(item, lang);
      const compositionNames = this.resolveCompositionNames(item, lang);
      const itemType = item.group?.translations?.find((translation) => translation.lang === lang)?.name
        ?? item.group?.code
        ?? tryOnConfig.vtoType;

      const generationItemName = this.resolveItemName(item, UserLangEnum.EN);
      const generationCompositionNames = this.resolveCompositionNames(item, UserLangEnum.EN);
      const generationItemDescription = this.resolveItemDescription(item, UserLangEnum.EN);
      const generationItemLength = this.resolveItemLength(item, UserLangEnum.EN);

      const validationResult = await validationProvider.validate({
        agent: validationAgent,
        vtoType: tryOnConfig.vtoType,
        validationPromptType: tryOnConfig.validationPromptType ?? this.defaultValidationPromptType(tryOnConfig.vtoType),
        userImageBuffer,
        productImageBuffer,
        itemName,
        compositionNames,
        itemType,
        lang,
      });

      if (!validationResult.suitable) {
        const log = await this.tryOnLogService.createLogEntry({
          item: { id: item.id },
          vtoType: tryOnConfig.vtoType,
          user: !_.isNil(userId) ? { id: userId } : null,
          status: AiTryOnLogStatusEnum.VALIDATION_REJECTED,
          suitable: false,
          validationReason: validationResult.reason,
          validationProvider: validationAgent.provider,
          generationProvider: null,
          validationCost: validationResult.cost,
          generationCost: null,
          validationAgent: { id: validationAgent.id },
          generationAgent: null,
          durationMs: Date.now() - startedAt,
          ipHash,
          userLang: lang,
          errorMessage: null,
          tryOnImage: { id: primary.id },
        });

        this.loggerService.info(this.TAG, 'Validation rejected', { tryOnLogId: log.id });
        return { code: 3, message: validationResult.reason, tryOnLogId: log.id };
      }

      const generationProvider = this.tryOnProviderRegistryService.getGenerationProvider(generationAgent.provider);
      const generationResult = await generationProvider.generate({
        agent: generationAgent,
        vtoType: tryOnConfig.vtoType,
        userImageBuffer,
        productRefUrls,
        context: {
          itemName: generationItemName,
          compositionNames: generationCompositionNames,
          itemDescription: generationItemDescription,
          itemLength: generationItemLength,
          lang,
          validationPromptType: tryOnConfig.validationPromptType ?? this.defaultValidationPromptType(tryOnConfig.vtoType),
        },
      });

      if (!_.isEmpty(generationResult.errorCode) || generationResult.imageBuffer.length === 0) {
        const log = await this.tryOnLogService.createLogEntry({
          item: { id: item.id },
          vtoType: tryOnConfig.vtoType,
          user: !_.isNil(userId) ? { id: userId } : null,
          status: AiTryOnLogStatusEnum.GENERATION_FAILED,
          suitable: true,
          validationReason: null,
          validationProvider: validationAgent.provider,
          generationProvider: generationAgent.provider,
          validationCost: validationResult.cost,
          generationCost: generationResult.cost,
          validationAgent: { id: validationAgent.id },
          generationAgent: { id: generationAgent.id },
          durationMs: Date.now() - startedAt,
          ipHash,
          userLang: lang,
          errorMessage: generationResult.errorCode ?? 'GENERATION_FAILED',
          tryOnImage: { id: primary.id },
        });

        return {
          code: 3,
          message: this.mapGenerationErrorMessage(
            generationResult.errorCode,
            tryOnConfig.vtoType,
            lang,
            generationAgent.provider,
          ),
          tryOnLogId: log.id,
        };
      }

      const draftLog = await this.tryOnLogService.createLogEntry({
        item: { id: item.id },
        vtoType: tryOnConfig.vtoType,
        user: !_.isNil(userId) ? { id: userId } : null,
        status: AiTryOnLogStatusEnum.SUCCESS,
        suitable: true,
        validationReason: null,
        validationProvider: validationAgent.provider,
        generationProvider: generationAgent.provider,
        validationCost: validationResult.cost,
        generationCost: generationResult.cost,
        validationAgent: { id: validationAgent.id },
        generationAgent: { id: generationAgent.id },
        durationMs: Date.now() - startedAt,
        ipHash,
        userLang: lang,
        errorMessage: null,
        tryOnImage: { id: primary.id },
        resultImageName: null,
      });

      try {
        const { imageSrc, imageName } = await this.tryOnResultImageService.saveResultImage(
          draftLog.id,
          generationResult.imageBuffer,
        );

        draftLog.resultImagePath = this.uploadPathService.getUrlPath(UploadPathEnum.TRY_ON);
        draftLog.resultImageName = imageName;
        await this.databaseService.getManager().save(draftLog);

        return {
          code: 1,
          tryOnLogId: draftLog.id,
          imageSrc,
          imageFormat: 'jpeg',
        };
      } catch (saveError) {
        this.loggerService.error(this.TAG, saveError);
        draftLog.status = AiTryOnLogStatusEnum.GENERATION_FAILED;
        draftLog.errorMessage = 'Failed to save result image';
        await this.databaseService.getManager().save(draftLog);

        return {
          code: 3,
          message: lang === UserLangEnum.EN
            ? 'Failed to save try-on result'
            : 'Не удалось сохранить результат примерки',
          tryOnLogId: draftLog.id,
        };
      }
    } finally {
      if (!_.isNil(tempFileName)) {
        await this.tryOnUserImageService.deleteTempUserImage(tempFileName);
      }
    }
  };

  /**
   * Сохраняет оценку пользователя по логу примерки
   * @param tryOnLogId - id лога
   * @param rating - GOOD / BAD
   * @param lang - язык сообщения об ошибке
   * @returns code 1 или code 3 с message
   */
  public setRating = async (
    tryOnLogId: number,
    rating: AiTryOnUserRatingEnum,
    lang: UserLangEnum,
  ): Promise<TryOnRatingResultType> => this.tryOnLogService.setUserRating(tryOnLogId, rating, lang);

  /**
   * Ищет конфиг примерки по группе
   * @param itemGroupId - id группы
   * @returns конфиг или null
   */
  private resolveTryOnConfig = async (itemGroupId?: number): Promise<AiItemGroupTryOnEntity | null> => {
    if (_.isNil(itemGroupId)) {
      return null;
    }

    return this.databaseService.getManager()
      .createQueryBuilder(AiItemGroupTryOnEntity, 'config')
      .where('config.itemGroup = :itemGroupId', { itemGroupId })
      .getOne();
  };

  /**
   * Дефолтный system-промпт по VTO-типу
   * @param vtoType - тип примерки
   * @returns AiPromptTypeEnum
   */
  private defaultValidationPromptType = (vtoType: AiTryOnVtoTypeEnum): AiPromptTypeEnum => {
    switch (vtoType) {
    case AiTryOnVtoTypeEnum.EARRING:
      return AiPromptTypeEnum.TRY_ON_VALIDATION_SYSTEM_EARRING;
    case AiTryOnVtoTypeEnum.NECKLACE:
    default:
      return AiPromptTypeEnum.TRY_ON_VALIDATION_SYSTEM_NECKLACE;
    }
  };

  /**
   * Собирает абсолютный путь к файлу товара в public/
   * @param imageSrc - относительный /items/... путь
   * @returns абсолютный путь
   */
  private resolveProductImageAbsolutePath = (imageSrc: string): string => {
    const normalized = imageSrc.replace(/^\//, '');
    return join(this.uploadPathService.uploadFilesPath, ...normalized.split('/'));
  };

  /**
   * Публичный URL изображения товара для generation-провайдера
   * @param imageSrc - относительный путь
   * @returns абсолютный URL
   */
  private buildPublicImageUrl = (imageSrc: string): string => {
    const host = process.env.NEXT_PUBLIC_PRODUCTION_HOST ?? '';
    const normalizedSrc = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
    return `${host}${normalizedSrc}`;
  };

  /**
   * Имя товара на языке клиента
   * @param item - товар
   * @param lang - язык
   * @returns название
   */
  private resolveItemName = (item: ItemEntity, lang: UserLangEnum): string => item.translations?.find((translation) => translation.lang === lang)?.name
    ?? item.translations?.[0]?.name
    ?? `Item #${item.id}`;

  /**
   * Описание товара на языке клиента
   * @param item - товар
   * @param lang - язык
   * @returns текст описания или пустая строка
   */
  private resolveItemDescription = (item: ItemEntity, lang: UserLangEnum): string => {
    const translation = item.translations?.find(({ lang: translationLang }) => translationLang === lang)
      ?? item.translations?.[0];

    return translation?.description?.trim() ?? '';
  };

  /**
   * Длина/размер товара на языке клиента
   * @param item - товар
   * @param lang - язык
   * @returns строка длины или пустая строка
   */
  private resolveItemLength = (item: ItemEntity, lang: UserLangEnum): string => {
    const translation = item.translations?.find(({ lang: translationLang }) => translationLang === lang)
      ?? item.translations?.[0];

    return translation?.length?.trim() ?? '';
  };

  /**
   * Список составов через запятую
   * @param item - товар
   * @param lang - язык
   * @returns строка compositions
   */
  private resolveCompositionNames = (item: ItemEntity, lang: UserLangEnum): string => {
    if (_.isEmpty(item.compositions)) {
      return '';
    }

    return item.compositions
      .map((composition) => composition.translations?.find((translation) => translation.lang === lang)?.name
        ?? composition.translations?.[0]?.name
        ?? '')
      .filter(Boolean)
      .join(', ')
      .trim();
  };

  /**
   * Локализованное сообщение об ошибке generation
   * @param errorCode - код провайдера
   * @param vtoType - тип примерки
   * @param lang - язык
   * @param generationProvider - провайдер generation
   * @returns текст для UI
   */
  private mapGenerationErrorMessage = (
    errorCode: string | undefined,
    vtoType: AiTryOnVtoTypeEnum,
    lang: UserLangEnum,
    generationProvider: AiProviderTypeEnum,
  ): string => {
    if (generationProvider === AiProviderTypeEnum.CODING_MANTRA) {
      if (lang === UserLangEnum.EN) {
        if (errorCode === 'PROVIDER_TIMEOUT') {
          return 'Generation timed out. Please try again.';
        }
        if (errorCode === 'PROVIDER_RATE_LIMIT') {
          return 'Service is busy. Try again in a minute.';
        }
        if (errorCode === 'PROVIDER_AUTH_FAILED') {
          return 'Try-on is temporarily unavailable.';
        }
        if (errorCode === 'PROVIDER_INSUFFICIENT_CREDITS') {
          return 'Try-on is temporarily unavailable due to provider limits. Please try again later.';
        }
        if (errorCode === 'INVALID_PROVIDER_RESPONSE') {
          return 'Could not get a result. Try another photo.';
        }
        return 'Try-on generation failed. Please try another photo.';
      }

      if (errorCode === 'PROVIDER_TIMEOUT') {
        return 'Генерация заняла слишком много времени. Попробуйте ещё раз.';
      }
      if (errorCode === 'PROVIDER_RATE_LIMIT') {
        return 'Сервис перегружен. Попробуйте через минуту.';
      }
      if (errorCode === 'PROVIDER_AUTH_FAILED') {
        return 'Сервис примерки временно недоступен.';
      }
      if (errorCode === 'PROVIDER_INSUFFICIENT_CREDITS') {
        return 'Сервис примерки временно недоступен из‑за лимита провайдера. Попробуйте позже.';
      }
      if (errorCode === 'INVALID_PROVIDER_RESPONSE') {
        return 'Не удалось получить результат. Попробуйте другое фото.';
      }
      return 'Не удалось выполнить примерку. Попробуйте другое фото.';
    }

    if (lang === UserLangEnum.EN) {
      if (errorCode === 'OBJECT_DETECTION_FAIL') {
        return `Could not detect the ${vtoType.toLowerCase()} on the product photo.`;
      }
      if (errorCode === 'PHOTO_DETECTION_FAIL' || errorCode === 'PHOTO_CHECK_INVALID') {
        return 'Photo pose check failed: face the camera, keep the neck clearly visible, avoid tilting the head.';
      }
      return 'Try-on generation failed. Please try another photo.';
    }

    if (errorCode === 'OBJECT_DETECTION_FAIL') {
      return 'Не удалось распознать украшение на фото товара.';
    }
    if (errorCode === 'PHOTO_DETECTION_FAIL' || errorCode === 'PHOTO_CHECK_INVALID') {
      return 'Фото не прошло проверку позы: лицо анфас, шея хорошо видна, без сильного наклона головы.';
    }
    return 'Не удалось выполнить примерку. Попробуйте другое фото.';
  };
}
