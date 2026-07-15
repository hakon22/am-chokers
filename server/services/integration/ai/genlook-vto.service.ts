import axios from 'axios';
import FormData from 'form-data';
import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { ProxyHttpClientService } from '@server/services/app/proxy-http-client.service';
import { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { TryOnGenerationContextInterface } from '@server/services/integration/ai/interfaces/try-on-generation-provider.interface';

export interface GenlookGenerateParamsInterface {
  agent: AiAgentEntity;
  vtoType: AiTryOnVtoTypeEnum;
  itemId: number;
  userImageBuffer: Buffer;
  productRefUrls: string[];
  context: TryOnGenerationContextInterface;
}

export interface GenlookGenerateResultInterface {
  imageBuffer: Buffer;
  cost: number;
  errorCode?: string;
}

interface GenlookErrorBodyInterface {
  code?: string;
  message?: string;
  status?: number;
}

interface GenlookUploadResponseInterface {
  imageId?: string;
}

interface GenlookTryOnResponseInterface {
  generationId?: string;
  status?: string;
}

interface GenlookGenerationStatusInterface {
  generationId?: string;
  status?: string;
  resultImageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Singleton
export class GenlookVtoService extends BaseService {
  private readonly TAG = 'GenlookVtoService';

  private readonly proxyHttpClientService = Container.get(ProxyHttpClientService);

  private readonly overallTimeoutMs = 120000;

  private readonly pollIntervalMs = 2000;

  private readonly singleRequestTimeoutMs = 60000;

  private readonly estimatedGenerationCostRub = 8.0;

  /** Передавать ли длину/размер товара в generation description */
  private readonly includeItemLengthInPrompt = false;

  /**
   * Генерирует результат примерки через Genlook Virtual Try-On API
   * @param params - агент, товар, selfie, ref URL и контекст
   * @returns buffer результата или ошибка с кодом
   */
  public generate = async (params: GenlookGenerateParamsInterface): Promise<GenlookGenerateResultInterface> => {
    const { agent, vtoType, itemId, userImageBuffer, productRefUrls, context } = params;

    if (_.isEmpty(agent.apiKey)) {
      throw new Error(`Genlook agent ${agent.id} has empty api_key`);
    }

    if (_.isNil(agent.baseUrl) || _.isEmpty(agent.baseUrl)) {
      throw new Error(`Genlook agent ${agent.id} has empty base_url`);
    }

    if (_.isEmpty(productRefUrls)) {
      throw new Error('Product reference URLs are required');
    }

    const agentBaseUrl = agent.baseUrl as string;
    const baseUrl = agentBaseUrl.replace(/\/$/, '');
    const apiKey = agent.apiKey as string;
    const authHeaders = {
      'x-api-key': apiKey,
    };
    const startedAt = Date.now();

    try {
      const imageId = await this.uploadPersonImage(baseUrl, authHeaders, userImageBuffer);
      const generationId = await this.createTryOn({
        baseUrl,
        authHeaders,
        imageId,
        itemId,
        vtoType,
        productRefUrl: productRefUrls[0],
        context,
      });
      const resultImageUrl = await this.pollGenerationResult(baseUrl, authHeaders, generationId, startedAt);
      const imageBuffer = await this.downloadResultImage(resultImageUrl);

      if (imageBuffer.length === 0) {
        this.loggerService.warn(this.TAG, 'Generation returned empty image', {
          itemId,
          vtoType,
          generationId,
        });

        return {
          imageBuffer: Buffer.alloc(0),
          cost: 0,
          errorCode: 'INVALID_PROVIDER_RESPONSE',
        };
      }

      this.loggerService.info(this.TAG, 'Generation succeeded', {
        itemId,
        vtoType,
        generationId,
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
        itemId,
        vtoType,
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
   * Загружает селфи пользователя в Genlook без 4:5 crop
   * @param baseUrl - base URL API
   * @param authHeaders - заголовки с API-ключом
   * @param userImageBuffer - JPEG buffer селфи
   * @returns imageId для person.image.source.id
   */
  private uploadPersonImage = async (
    baseUrl: string,
    authHeaders: Record<string, string>,
    userImageBuffer: Buffer,
  ): Promise<string> => {
    const endpoint = `${baseUrl}/tryon/v1/images/upload`;
    const formData = new FormData();
    formData.append('file', userImageBuffer, {
      filename: 'person.jpg',
      contentType: 'image/jpeg',
    });
    formData.append('crop', 'false');

    const response = await this.proxyHttpClientService.post<GenlookUploadResponseInterface>(
      endpoint,
      formData,
      {
        headers: {
          ...authHeaders,
          ...formData.getHeaders(),
        },
        timeout: this.singleRequestTimeoutMs,
      },
    );

    const { imageId } = response.data ?? {};
    if (_.isNil(imageId) || _.isEmpty(imageId)) {
      throw new Error('INVALID_PROVIDER_RESPONSE: Genlook upload returned empty imageId');
    }

    this.loggerService.info(this.TAG, 'Person image uploaded', { imageId });
    return imageId;
  };

  /**
   * Создаёт async try-on generation с inline product upsert
   * @param params - URL, auth, imageId, товар и контекст
   * @returns generationId для polling
   */
  private createTryOn = async (params: {
    baseUrl: string;
    authHeaders: Record<string, string>;
    imageId: string;
    itemId: number;
    vtoType: AiTryOnVtoTypeEnum;
    productRefUrl: string;
    context: TryOnGenerationContextInterface;
  }): Promise<string> => {
    const { baseUrl, authHeaders, imageId, itemId, vtoType, productRefUrl, context } = params;
    const endpoint = `${baseUrl}/tryon/v1/try-on`;
    const externalId = `item-${itemId}`;

    const response = await this.proxyHttpClientService.post<GenlookTryOnResponseInterface>(
      endpoint,
      {
        products: [{
          externalId,
          title: context.itemName,
          description: this.buildJewelryDescription(vtoType, context),
          images: [{ source: { url: productRefUrl } }],
        }],
        person: {
          image: {
            source: { id: imageId },
          },
        },
        output: {
          watermark: false,
        },
      },
      {
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
        },
        timeout: this.singleRequestTimeoutMs,
      },
    );

    const { generationId } = response.data ?? {};
    if (_.isNil(generationId) || _.isEmpty(generationId)) {
      throw new Error('INVALID_PROVIDER_RESPONSE: Genlook try-on returned empty generationId');
    }

    this.loggerService.info(this.TAG, 'Try-on created', { generationId, externalId, vtoType });
    return generationId;
  };

  /**
   * Опрашивает статус generation до COMPLETED / FAILED / timeout
   * @param baseUrl - base URL API
   * @param authHeaders - заголовки с API-ключом
   * @param generationId - id generation
   * @param startedAt - timestamp начала всего generate
   * @returns URL результата
   */
  private pollGenerationResult = async (
    baseUrl: string,
    authHeaders: Record<string, string>,
    generationId: string,
    startedAt: number,
  ): Promise<string> => {
    const endpoint = `${baseUrl}/tryon/v1/generations/${encodeURIComponent(generationId)}`;

    while (Date.now() - startedAt < this.overallTimeoutMs) {
      const response = await this.proxyHttpClientService.get<GenlookGenerationStatusInterface>(
        endpoint,
        {
          headers: authHeaders,
          timeout: this.singleRequestTimeoutMs,
        },
      );

      const statusPayload = response.data ?? {};
      const { status, resultImageUrl, errorCode } = statusPayload;

      if (status === 'COMPLETED') {
        if (_.isNil(resultImageUrl) || _.isEmpty(resultImageUrl)) {
          throw new Error('INVALID_PROVIDER_RESPONSE: Genlook completed without resultImageUrl');
        }
        return resultImageUrl;
      }

      if (status === 'FAILED') {
        const mappedCode = this.mapGenlookApiCode(errorCode);
        throw new Error(`${mappedCode}: Genlook generation failed (${errorCode ?? 'unknown'})`);
      }

      await this.sleep(this.pollIntervalMs);
    }

    throw new Error('PROVIDER_TIMEOUT: Genlook generation poll exceeded overall timeout');
  };

  /**
   * Скачивает итоговое изображение по временному URL
   * @param resultImageUrl - URL из generation status
   * @returns buffer изображения
   */
  private downloadResultImage = async (resultImageUrl: string): Promise<Buffer> => {
    const arrayBuffer = await this.proxyHttpClientService.downloadBinary(resultImageUrl);
    return Buffer.from(arrayBuffer);
  };

  /**
   * Собирает description для jewelry classification Genlook
   * @param vtoType - тип примерки
   * @param context - контекст товара
   * @returns строка description
   */
  private buildJewelryDescription = (vtoType: AiTryOnVtoTypeEnum, context: TryOnGenerationContextInterface): string => {
    const jewelryTypeLabel = vtoType === AiTryOnVtoTypeEnum.EARRING
      ? 'earrings'
      : 'necklace';

    const parts = [
      jewelryTypeLabel,
      this.normalizeProductText(context.compositionNames),
      this.normalizeProductText(context.itemDescription),
    ].filter((part) => !_.isEmpty(part));

    if (this.includeItemLengthInPrompt) {
      const length = this.normalizeProductText(context.itemLength);
      if (!_.isEmpty(length)) {
        parts.push(`Product size/length: ${length}`);
      }
    }

    return parts.join('. ');
  };

  /**
   * Нормализует текст товара (без HTML, лишних пробелов)
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
   * Пауза между poll-запросами
   * @param milliseconds - длительность паузы
   * @returns Promise после ожидания
   */
  private sleep = (milliseconds: number): Promise<void> => new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

  /**
   * Маппит код ошибки Genlook API во внутренний errorCode
   * @param code - код из тела ответа Genlook
   * @returns внутренний код
   */
  private mapGenlookApiCode = (code?: string): string => {
    if (_.isNil(code) || _.isEmpty(code)) {
      return 'GENERATION_FAILED';
    }

    switch (code) {
    case 'MISSING_API_KEY':
    case 'INVALID_API_KEY':
    case 'FORBIDDEN':
      return 'PROVIDER_AUTH_FAILED';
    case 'INSUFFICIENT_CREDITS':
    case 'QUOTA_EXCEEDED':
      return 'PROVIDER_INSUFFICIENT_CREDITS';
    case 'RATE_LIMITED':
      return 'PROVIDER_RATE_LIMIT';
    case 'GENERATION_FAILED':
      return 'GENERATION_FAILED';
    default:
      return 'GENERATION_FAILED';
    }
  };

  /**
   * Извлекает код ошибки из исключения axios или runtime
   * @param error - ошибка запроса
   * @returns строковый errorCode
   */
  private extractErrorCode = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.startsWith('PROVIDER_TIMEOUT')) {
        return 'PROVIDER_TIMEOUT';
      }
      if (error.message.startsWith('PROVIDER_AUTH_FAILED')) {
        return 'PROVIDER_AUTH_FAILED';
      }
      if (error.message.startsWith('PROVIDER_INSUFFICIENT_CREDITS')) {
        return 'PROVIDER_INSUFFICIENT_CREDITS';
      }
      if (error.message.startsWith('PROVIDER_RATE_LIMIT')) {
        return 'PROVIDER_RATE_LIMIT';
      }
      if (error.message.startsWith('INVALID_PROVIDER_RESPONSE')) {
        return 'INVALID_PROVIDER_RESPONSE';
      }
      if (error.message.startsWith('GENERATION_FAILED')) {
        return 'GENERATION_FAILED';
      }
      if (error.message.includes('HTTPS proxy is required')) {
        return 'PROVIDER_ERROR';
      }
    }

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        return 'PROVIDER_TIMEOUT';
      }

      const responseData = error.response?.data as GenlookErrorBodyInterface | undefined;
      const mappedFromBody = this.mapGenlookApiCode(responseData?.code);
      if (!_.isNil(responseData?.code) && !_.isEmpty(responseData?.code)) {
        return mappedFromBody;
      }

      const status = error.response?.status;
      if (status === 401 || status === 403) {
        return 'PROVIDER_AUTH_FAILED';
      }
      if (status === 402) {
        return 'PROVIDER_INSUFFICIENT_CREDITS';
      }
      if (status === 429) {
        return 'PROVIDER_RATE_LIMIT';
      }
      if (!_.isNil(status) && status >= 500) {
        return 'PROVIDER_ERROR';
      }

      return 'GENERATION_FAILED';
    }

    return 'GENERATION_FAILED';
  };
}
