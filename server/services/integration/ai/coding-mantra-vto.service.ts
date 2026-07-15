import axios from 'axios';
import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AiPromptTemplateService } from '@server/services/integration/ai/ai-prompt-template.service';
import { ProxyHttpClientService } from '@server/services/app/proxy-http-client.service';
import { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { TryOnGenerationContextInterface } from '@server/services/integration/ai/interfaces/try-on-generation-provider.interface';

export interface CodingMantraGenerateParamsInterface {
  agent: AiAgentEntity;
  vtoType: AiTryOnVtoTypeEnum;
  userImageBuffer: Buffer;
  productRefUrls: string[];
  context: TryOnGenerationContextInterface;
}

export interface CodingMantraGenerateResultInterface {
  imageBuffer: Buffer;
  cost: number;
  errorCode?: string;
}

interface CodingMantraApiResponseInterface {
  data?: {
    photoDataUri?: string;
  };
}

@Singleton
export class CodingMantraVtoService extends BaseService {
  private readonly TAG = 'CodingMantraVtoService';

  private readonly aiPromptTemplateService = Container.get(AiPromptTemplateService);

  private readonly proxyHttpClientService = Container.get(ProxyHttpClientService);

  private readonly requestTimeoutMs = 120000;

  private readonly estimatedGenerationCostRub = 1.0;

  private readonly outputResolution = '2K';

  private readonly defaultAspectRatioPortrait = '3:4';

  private readonly defaultAspectRatioSquare = '1:1';

  /** Временно не передаём длину/размер товара в generation (scene prompt и Hint) */
  private readonly includeItemLengthInPrompt = false;

  /**
   * Генерирует результат примерки через CodingMantra Jewelry Try-On API
   * @param params - агент, тип, selfie, ref URL и контекст товара
   * @returns buffer результата или ошибка с кодом
   */
  public generate = async (params: CodingMantraGenerateParamsInterface): Promise<CodingMantraGenerateResultInterface> => {
    const { agent, vtoType, userImageBuffer, productRefUrls, context } = params;

    if (_.isEmpty(agent.apiKey)) {
      throw new Error(`CodingMantra agent ${agent.id} has empty api_key`);
    }

    if (_.isNil(agent.baseUrl) || _.isEmpty(agent.baseUrl)) {
      throw new Error(`CodingMantra agent ${agent.id} has empty base_url`);
    }

    if (_.isEmpty(productRefUrls)) {
      throw new Error('Product reference URLs are required');
    }

    if (_.isEmpty(agent.model)) {
      throw new Error(`CodingMantra agent ${agent.id} has empty model`);
    }

    const agentBaseUrl = agent.baseUrl as string;
    const baseUrl = agentBaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/api/image/jewelry-try-on`;
    const headers = {
      Authorization: `Bearer ${agent.apiKey as string}`,
      'Content-Type': 'application/json',
    };

    const prompt = await this.resolveGenerationPrompt(vtoType, context);
    const personImage = `data:image/jpeg;base64,${userImageBuffer.toString('base64')}`;
    const aspectRatio = this.resolveAspectRatio(vtoType);
    const jewelryLabel = this.buildJewelryLabel(context.itemName, context.compositionNames);
    const jewelryImagePrompt = this.buildJewelryImagePrompt(context);
    const refUrl = productRefUrls[0];
    const jewelryImage: { url: string; label: string; prompt?: string; } = {
      url: refUrl,
      label: jewelryLabel,
    };

    if (!_.isEmpty(jewelryImagePrompt)) {
      jewelryImage.prompt = jewelryImagePrompt;
    }

    const jewelryImages = [jewelryImage];

    const startedAt = Date.now();

    try {
      const response = await this.proxyHttpClientService.post<CodingMantraApiResponseInterface>(endpoint, {
        jewelryImages,
        personImage,
        prompt,
        model: agent.model,
        resolution: this.outputResolution,
        aspectRatio,
        outputResult: 'base64',
      }, {
        headers,
        timeout: this.requestTimeoutMs,
      });

      const imageBuffer = this.parsePhotoDataUri(response.data?.data?.photoDataUri);
      if (imageBuffer.length === 0) {
        this.loggerService.warn(this.TAG, 'Generation returned empty image', {
          refCount: jewelryImages.length,
          vtoType,
        });

        return {
          imageBuffer: Buffer.alloc(0),
          cost: 0,
          errorCode: 'INVALID_PROVIDER_RESPONSE',
        };
      }

      this.loggerService.info(this.TAG, 'Generation succeeded', {
        refCount: jewelryImages.length,
        vtoType,
        duration: Date.now() - startedAt,
      });

      return {
        imageBuffer,
        cost: this.estimatedGenerationCostRub,
      };
    } catch (error) {
      const errorCode = this.extractErrorCode(error);
      this.loggerService.warn(this.TAG, 'Generation failed', {
        errorCode,
        refCount: jewelryImages.length,
        duration: Date.now() - startedAt,
      });

      return {
        imageBuffer: Buffer.alloc(0),
        cost: 0,
        errorCode,
      };
    }
  };

  /**
   * Загружает и подставляет generation-промпт по VTO-типу
   * @param vtoType - тип примерки
   * @param context - контекст товара
   * @returns текст prompt для CodingMantra
   */
  private resolveGenerationPrompt = async (vtoType: AiTryOnVtoTypeEnum, context: TryOnGenerationContextInterface): Promise<string> => {
    const promptType = this.resolveGenerationPromptType(vtoType);
    const template = await this.aiPromptTemplateService.getActiveByType(promptType);

    if (_.isNil(template)) {
      throw new Error(`Active generation prompt template not found: ${promptType}`);
    }

    return this.aiPromptTemplateService.applyPlaceholders(template.content, {
      itemName: context.itemName,
      compositionNames: context.compositionNames,
      itemDescription: context.itemDescription,
      itemLength: this.includeItemLengthInPrompt ? context.itemLength : '',
    });
  };

  /**
   * Маппинг VTO / validation-типа на generation prompt enum
   * @param vtoType - тип примерки
   * @param validationPromptType - override из item_group_try_on
   * @returns AiPromptTypeEnum для generation
   */
  private resolveGenerationPromptType = (vtoType: AiTryOnVtoTypeEnum): AiPromptTypeEnum => {
    switch (vtoType) {
    case AiTryOnVtoTypeEnum.EARRING:
      return AiPromptTypeEnum.TRY_ON_GENERATION_EARRING;
    case AiTryOnVtoTypeEnum.NECKLACE:
    default:
      return AiPromptTypeEnum.TRY_ON_GENERATION_NECKLACE;
    }
  };

  /**
   * Выбирает aspect ratio по типу примерки
   * @param vtoType - тип примерки
   * @returns строка aspect ratio для API
   */
  private resolveAspectRatio = (vtoType: AiTryOnVtoTypeEnum): string => {
    switch (vtoType) {
    case AiTryOnVtoTypeEnum.NECKLACE:
    case AiTryOnVtoTypeEnum.EARRING:
      return this.defaultAspectRatioPortrait;
    default:
      return this.defaultAspectRatioSquare;
    }
  };

  /**
   * Собирает hint (prompt) для jewelryImages: только размер/длина товара
   * @param context - контекст товара
   * @returns текст hint или пустая строка
   */
  private buildJewelryImagePrompt = (context: TryOnGenerationContextInterface): string => {
    if (!this.includeItemLengthInPrompt) {
      return '';
    }

    const length = this.normalizeProductText(context.itemLength);

    if (_.isEmpty(length)) {
      return '';
    }

    return `Product size/length: ${length}`;
  };

  /**
   * Нормализует текст товара для prompt (без HTML, лишних пробелов)
   * @param text - исходный текст
   * @returns очищенная строка
   */
  private normalizeProductText = (text: string): string => {
    if (_.isEmpty(text)) {
      return '';
    }

    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  /**
   * Собирает label украшения для jewelryImages
   * @param itemName - название товара
   * @param compositionNames - состав
   * @returns строка label
   */
  private buildJewelryLabel = (itemName: string, compositionNames: string): string => {
    if (_.isEmpty(compositionNames)) {
      return itemName;
    }

    return `${itemName} (${compositionNames})`;
  };

  /**
   * Декодирует photoDataUri из ответа CodingMantra
   * @param photoDataUri - data URI или raw base64
   * @returns buffer изображения
   */
  private parsePhotoDataUri = (photoDataUri?: string): Buffer => {
    if (_.isNil(photoDataUri) || _.isEmpty(photoDataUri)) {
      return Buffer.alloc(0);
    }

    const dataUriMatch = photoDataUri.match(/^data:image\/[a-z+]+;base64,(.+)$/i);
    const base64Payload = dataUriMatch?.[1] ?? photoDataUri;

    try {
      return Buffer.from(base64Payload, 'base64');
    } catch {
      return Buffer.alloc(0);
    }
  };

  /**
   * Извлекает текст ошибки из тела ответа CodingMantra
   * @param responseData - тело ответа axios
   * @returns сообщение об ошибке или пустая строка
   */
  private extractProviderErrorMessage = (responseData: unknown): string => {
    if (!_.isObject(responseData)) {
      return '';
    }

    const { error } = responseData as { error?: { message?: string; }; };
    return error?.message ?? '';
  };

  /**
   * Извлекает код ошибки из исключения axios или runtime
   * @param error - ошибка запроса
   * @returns строковый errorCode
   */
  private extractErrorCode = (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return 'PROVIDER_TIMEOUT';
      }

      const status = error.response?.status;
      const providerMessage = this.extractProviderErrorMessage(error.response?.data);
      if (providerMessage.toLowerCase().includes('insufficient credits')) {
        return 'PROVIDER_INSUFFICIENT_CREDITS';
      }
      if (status === 401 || status === 403) {
        return 'PROVIDER_AUTH_FAILED';
      }
      if (status === 429) {
        return 'PROVIDER_RATE_LIMIT';
      }
      if (!_.isNil(status) && status >= 500) {
        return 'PROVIDER_ERROR';
      }

      return 'GENERATION_FAILED';
    }

    if (error instanceof Error) {
      if (error.message.includes('HTTPS proxy is required')) {
        return 'PROVIDER_ERROR';
      }
    }

    return 'GENERATION_FAILED';
  };
}
