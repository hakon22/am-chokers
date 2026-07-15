import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { AiModelService } from '@server/services/integration/ai/ai-model.service';
import { AiPromptTemplateService } from '@server/services/integration/ai/ai-prompt-template.service';
import { LoggerService } from '@server/services/app/logger.service';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type {
  TryOnValidationParamsInterface,
  TryOnValidationProviderInterface,
  TryOnValidationResultInterface,
} from '@server/services/integration/ai/interfaces/try-on-validation-provider.interface';

@Singleton
export class RouterAiValidationProvider implements TryOnValidationProviderInterface {
  private readonly TAG = 'RouterAiValidationProvider';

  private readonly loggerService = Container.get(LoggerService);

  private readonly aiModelService = Container.get(AiModelService);

  private readonly aiPromptTemplateService = Container.get(AiPromptTemplateService);

  /**
   * Pre-validation фото через RouterAI + LangChain
   * @param params - агент, промпты, изображения и метаданные товара
   * @returns suitable, reason, cost
   */
  public validate = async (params: TryOnValidationParamsInterface): Promise<TryOnValidationResultInterface> => {
    const {
      agent,
      validationPromptType,
      userImageBuffer,
      productImageBuffer,
      itemName,
      compositionNames,
      itemType,
      vtoType,
      lang,
    } = params;

    const [systemTemplate, userTemplate] = await Promise.all([
      this.aiPromptTemplateService.getActiveByType(validationPromptType),
      this.aiPromptTemplateService.getActiveByType(AiPromptTypeEnum.TRY_ON_VALIDATION_USER),
    ]);

    if (_.isNil(systemTemplate) || _.isNil(userTemplate)) {
      throw new Error('Validation prompt templates are not configured');
    }

    const placeholders = {
      itemName,
      compositionNames,
      itemType,
      vtoType,
      lang,
    };

    const systemContent = this.aiPromptTemplateService.applyPlaceholders(systemTemplate.content, placeholders);
    const userText = this.aiPromptTemplateService.applyPlaceholders(userTemplate.content, placeholders);

    const model = this.aiModelService.getChatModel(agent, {
      jsonResponse: {
        name: 'try_on_validation',
        description: 'Результат pre-validation фото для виртуальной примерки',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            suitable: {
              type: 'boolean',
              description: 'Подходит ли фото пользователя для примерки',
            },
            reason: {
              type: 'string',
              description: 'Краткое объяснение на языке пользователя (1–2 предложения)',
            },
          },
          required: ['suitable', 'reason'],
        },
      },
    });
    const response = await model.invoke([
      new SystemMessage(systemContent),
      new HumanMessage({
        content: [
          { type: 'text', text: userText },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${userImageBuffer.toString('base64')}`,
            },
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${productImageBuffer.toString('base64')}`,
            },
          },
        ],
      }),
    ]);

    const cost = this.resolveValidationCost(response);
    const contentText = typeof response.content === 'string'
      ? response.content
      : JSON.stringify(response.content);

    const parsed = this.aiModelService.extractJSON<{ suitable?: boolean; reason?: string; }>(contentText);

    if (_.isNil(parsed) || typeof parsed.suitable !== 'boolean') {
      this.loggerService.warn(this.TAG, 'Failed to parse validation JSON', { contentText });
      return {
        suitable: false,
        reason: lang === UserLangEnum.EN
          ? 'Could not validate the photo. Please try another image.'
          : 'Не удалось проверить фото. Попробуйте другое изображение.',
        cost,
      };
    }

    return {
      suitable: parsed.suitable,
      reason: _.isEmpty(parsed.reason)
        ? (lang === UserLangEnum.EN ? 'Photo is not suitable for try-on.' : 'Фото не подходит для примерки.')
        : (parsed.reason as string),
      cost,
    };
  };

  /**
   * Берёт фактическую стоимость из ответа RouterAI, если LangChain её сохранил
   * @param response - AIMessage от LangChain
   * @returns cost или 0 (LangChain часто оставляет только tokenUsage без cost)
   */
  private resolveValidationCost = (response: {
    response_metadata?: Record<string, unknown>;
    usage_metadata?: Record<string, unknown>;
  }): number => {
    const cost = this.aiModelService.extractCost(response);

    if (!_.isNil(cost)) {
      return cost;
    }

    this.loggerService.warn(this.TAG, 'RouterAI cost missing in LangChain metadata (only tokenUsage may be present)', {
      tokenUsage: response.response_metadata?.tokenUsage,
      usageMetadata: response.usage_metadata,
    });
    return 0;
  };
}
