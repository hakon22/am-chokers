import _ from 'lodash';
import { Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AiPromptTemplateEntity } from '@server/db/entities/ai/ai-prompt-template.entity';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';

@Singleton
export class AiPromptTemplateService extends BaseService {
  private readonly TAG = 'AiPromptTemplateService';

  /**
   * Возвращает активный шаблон промпта по типу
   * @param promptType - значение AiPromptTypeEnum
   * @returns шаблон или null
   */
  public getActiveByType = async (promptType: AiPromptTypeEnum): Promise<AiPromptTemplateEntity | null> => {
    const template = await this.databaseService.getManager()
      .createQueryBuilder(AiPromptTemplateEntity, 'template')
      .where('template.type = :promptType', { promptType })
      .andWhere('template.isActive = true')
      .getOne();

    if (_.isNil(template)) {
      this.loggerService.warn(this.TAG, `Active prompt template not found for type=${promptType}`);
    }

    return template;
  };

  /**
   * Подставляет плейсхолдеры {{key}} в текст промпта
   * @param content - исходный текст
   * @param placeholders - словарь значений
   * @returns текст с подставленными значениями
   */
  public applyPlaceholders = (content: string, placeholders: Record<string, string>): string => {
    if (_.isEmpty(content)) {
      return content;
    }

    return Object.entries(placeholders).reduce((result, [key, value]) => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      return result.replace(pattern, value ?? '');
    }, content);
  };
}
