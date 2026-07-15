import { Container, Singleton } from 'typescript-ioc';

import { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';
import { RouterAiValidationProvider } from '@server/services/integration/ai/providers/router-ai-validation.provider';
import { CodingMantraGenerationProvider } from '@server/services/integration/ai/providers/coding-mantra-generation.provider';
import { GenlookGenerationProvider } from '@server/services/integration/ai/providers/genlook-generation.provider';
import type { TryOnValidationProviderInterface } from '@server/services/integration/ai/interfaces/try-on-validation-provider.interface';
import type { TryOnGenerationProviderInterface } from '@server/services/integration/ai/interfaces/try-on-generation-provider.interface';

@Singleton
export class TryOnProviderRegistryService {
  private readonly validationProviders = new Map<AiProviderTypeEnum, TryOnValidationProviderInterface>();

  private readonly generationProviders = new Map<AiProviderTypeEnum, TryOnGenerationProviderInterface>();

  constructor() {
    this.validationProviders.set(
      AiProviderTypeEnum.ROUTER_AI,
      Container.get(RouterAiValidationProvider),
    );
    this.generationProviders.set(
      AiProviderTypeEnum.CODING_MANTRA,
      Container.get(CodingMantraGenerationProvider),
    );
    this.generationProviders.set(
      AiProviderTypeEnum.GENLOOK,
      Container.get(GenlookGenerationProvider),
    );
  }

  /**
   * Возвращает validation-провайдер по типу
   * @param providerType - AiProviderTypeEnum
   * @returns реализация validation
   */
  public getValidationProvider = (providerType: AiProviderTypeEnum): TryOnValidationProviderInterface => {
    const provider = this.validationProviders.get(providerType);
    if (!provider) {
      throw new Error(`Validation provider is not registered: ${providerType}`);
    }
    return provider;
  };

  /**
   * Возвращает generation-провайдер по типу
   * @param providerType - AiProviderTypeEnum
   * @returns реализация generation
   */
  public getGenerationProvider = (providerType: AiProviderTypeEnum): TryOnGenerationProviderInterface => {
    const provider = this.generationProviders.get(providerType);
    if (!provider) {
      throw new Error(`Generation provider is not registered: ${providerType}`);
    }
    return provider;
  };
}
