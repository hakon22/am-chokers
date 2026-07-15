import type { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import type { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';

export interface TryOnValidationParamsInterface {
  agent: AiAgentEntity;
  vtoType: AiTryOnVtoTypeEnum;
  validationPromptType: AiPromptTypeEnum;
  userImageBuffer: Buffer;
  productImageBuffer: Buffer;
  itemName: string;
  compositionNames: string;
  itemType: string;
  lang: string;
}

export interface TryOnValidationResultInterface {
  suitable: boolean;
  reason: string;
  cost: number;
}

export interface TryOnValidationProviderInterface {
  validate: (params: TryOnValidationParamsInterface) => Promise<TryOnValidationResultInterface>;
}
