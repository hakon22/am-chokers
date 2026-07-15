import { Container, Singleton } from 'typescript-ioc';

import { GenlookVtoService } from '@server/services/integration/ai/genlook-vto.service';
import type {
  TryOnGenerationParamsInterface,
  TryOnGenerationProviderInterface,
  TryOnGenerationResultInterface,
} from '@server/services/integration/ai/interfaces/try-on-generation-provider.interface';

@Singleton
export class GenlookGenerationProvider implements TryOnGenerationProviderInterface {
  private readonly genlookVtoService = Container.get(GenlookVtoService);

  /**
   * Генерация примерки через Genlook Virtual Try-On
   * @param params - агент, товар, selfie, ref URL и контекст
   * @returns buffer результата и метаданные
   */
  public generate = async (params: TryOnGenerationParamsInterface): Promise<TryOnGenerationResultInterface> => this.genlookVtoService.generate({
    agent: params.agent,
    vtoType: params.vtoType,
    itemId: params.itemId,
    userImageBuffer: params.userImageBuffer,
    productRefUrls: params.productRefUrls,
    context: params.context,
  });
}
