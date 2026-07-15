import type { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import type { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';
import type { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import type { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export interface TryOnGenerationContextInterface {
  itemName: string;
  compositionNames: string;
  itemDescription: string;
  itemLength: string;
  lang: UserLangEnum;
  validationPromptType: AiPromptTypeEnum | null;
}

export interface TryOnGenerationParamsInterface {
  agent: AiAgentEntity;
  vtoType: AiTryOnVtoTypeEnum;
  itemId: number;
  userImageBuffer: Buffer;
  productRefUrls: string[];
  context: TryOnGenerationContextInterface;
}

export interface TryOnGenerationResultInterface {
  imageBuffer: Buffer;
  cost: number;
  errorCode?: string;
}

export interface TryOnGenerationProviderInterface {
  generate: (params: TryOnGenerationParamsInterface) => Promise<TryOnGenerationResultInterface>;
}
