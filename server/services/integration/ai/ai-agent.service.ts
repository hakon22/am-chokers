import _ from 'lodash';
import { Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import { AiAgentPurposeEnum } from '@server/types/ai/enums/ai-agent-purpose.enum';

@Singleton
export class AiAgentService extends BaseService {
  private readonly TAG = 'AiAgentService';

  /**
   * Возвращает активного агента по назначению
   * @param purpose - TRY_ON_VALIDATION или TRY_ON_GENERATION
   * @returns активный агент или null
   */
  public getActiveAgentByPurpose = async (purpose: AiAgentPurposeEnum): Promise<AiAgentEntity | null> => {
    const agent = await this.databaseService.getManager()
      .createQueryBuilder(AiAgentEntity, 'agent')
      .where('agent.purpose = :purpose', { purpose })
      .andWhere('agent.isActive = true')
      .getOne();

    if (_.isNil(agent)) {
      this.loggerService.warn(this.TAG, `Active AI agent not found for purpose=${purpose}`);
    }

    return agent;
  };
}
