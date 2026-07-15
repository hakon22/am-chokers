import { Container, Singleton } from 'typescript-ioc';

import { CodingMantraVtoService } from '@server/services/integration/ai/coding-mantra-vto.service';
import type {
  TryOnGenerationParamsInterface,
  TryOnGenerationProviderInterface,
  TryOnGenerationResultInterface,
} from '@server/services/integration/ai/interfaces/try-on-generation-provider.interface';

@Singleton
export class CodingMantraGenerationProvider implements TryOnGenerationProviderInterface {
  private readonly codingMantraVtoService = Container.get(CodingMantraVtoService);

  /**
   * Генерация примерки через CodingMantra Jewelry Try-On
   * @param params - агент, selfie, ref URL и контекст товара
   * @returns buffer результата и метаданные попыток
   */
  public generate = async (params: TryOnGenerationParamsInterface): Promise<TryOnGenerationResultInterface> => this.codingMantraVtoService.generate({
    agent: params.agent,
    vtoType: params.vtoType,
    userImageBuffer: params.userImageBuffer,
    productRefUrls: params.productRefUrls,
    context: params.context,
  });
}
