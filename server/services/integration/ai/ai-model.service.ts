import { ChatOpenAI } from '@langchain/openai';
import _ from 'lodash';
import { Singleton } from 'typescript-ioc';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

import { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';

interface JsonResponseSchemaInterface {
  /** Имя схемы (a-z, A-Z, 0-9, _ и -, до 64 символов) */
  name: string;
  /** JSON Schema объекта ответа */
  schema: Record<string, unknown>;
  /** Описание назначения формата для модели */
  description?: string;
  /** Строгое следование схеме (если провайдер поддерживает) */
  strict?: boolean;
}

interface GetChatModelOptionsInterface {
  /** Схема JSON-ответа через response_format.json_schema */
  jsonResponse?: JsonResponseSchemaInterface;
}

@Singleton
export class AiModelService {
  /**
   * Создаёт ChatOpenAI из конфигурации агента
   * @param agent - запись ai.agent
   * @param options - доп. параметры вызова (например jsonResponse)
   * @returns инстанс chat-модели LangChain
   */
  public getChatModel = (agent: AiAgentEntity, options?: GetChatModelOptionsInterface): BaseChatModel => {
    if (_.isEmpty(agent.apiKey)) {
      throw new Error(`AI agent ${agent.id} has empty api_key`);
    }

    const temperature = _.isNil(agent.temperature) ? 0 : Number(agent.temperature);
    const { jsonResponse } = options ?? {};

    const chatModel = new ChatOpenAI({
      model: agent.model,
      temperature,
      apiKey: agent.apiKey,
      maxTokens: agent.maxTokens ?? undefined,
      configuration: {
        ...(agent.baseUrl ? { baseURL: agent.baseUrl } : {}),
      },
    });

    if (_.isNil(jsonResponse)) {
      return chatModel;
    }

    const { name, schema, description, strict } = jsonResponse;

    return chatModel.withConfig({
      response_format: {
        type: 'json_schema',
        json_schema: {
          name,
          schema,
          ...(description ? { description } : {}),
          strict: _.isNil(strict) ? true : strict,
        },
      },
    }) as BaseChatModel;
  };

  /**
   * Извлекает JSON-объект из текста ответа модели
   * @param text - сырой текст ответа
   * @returns распарсенный объект или null
   */
  public extractJSON = <T>(text: string): T | null => {
    const jsonRegex = /(\{[\s\S]*\}|\[[\s\S]*\])/;
    const match = text.match(jsonRegex);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[1]) as T;
    } catch {
      return null;
    }
  };

  /**
   * Извлекает стоимость запроса из ответа LangChain (RouterAI: usage.cost)
   * @param response - ответ model.invoke с response_metadata
   * @returns cost в валюте биллинга RouterAI или null, если поля нет
   */
  public extractCost = (response: { response_metadata?: Record<string, unknown>; }): number | null => {
    const { response_metadata: responseMetadata } = response;

    if (_.isNil(responseMetadata)) {
      return null;
    }

    const usage = responseMetadata.usage as { cost?: unknown; } | undefined;
    if (!_.isNil(usage) && typeof usage.cost === 'number') {
      return usage.cost;
    }

    if (typeof responseMetadata.cost === 'number') {
      return responseMetadata.cost;
    }

    return null;
  };
}
