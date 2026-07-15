import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';
import { AiAgentPurposeEnum } from '@server/types/ai/enums/ai-agent-purpose.enum';

/** AI-агент (конфиг провайдера для validation / generation) */
@Entity({
  name: 'agent',
  schema: 'ai',
})
export class AiAgentEntity extends BaseEntity {
  /** Уникальный id агента */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения */
  @UpdateDateColumn()
  public updated: Date;

  /** Soft delete */
  @DeleteDateColumn()
  public deleted: Date;

  /** Человекочитаемое имя */
  @Column('character varying')
  public name: string;

  /** Провайдер API */
  @Column({
    type: 'enum',
    enum: AiProviderTypeEnum,
    enumName: 'provider_type_enum',
  })
  public provider: AiProviderTypeEnum;

  /** Назначение агента */
  @Column({
    type: 'enum',
    enum: AiAgentPurposeEnum,
    enumName: 'agent_purpose_enum',
  })
  public purpose: AiAgentPurposeEnum;

  /** Нужен ли исходящий HTTPS-прокси */
  @Column('boolean', {
    name: 'requires_proxy',
    default: false,
  })
  public requiresProxy: boolean;

  /** Идентификатор модели у провайдера */
  @Column('character varying')
  public model: string;

  /** Температура generation/validation */
  @Column('numeric', {
    precision: 2,
    scale: 1,
  })
  public temperature: number;

  /** Base URL API провайдера */
  @Column('character varying', {
    name: 'base_url',
    nullable: true,
  })
  public baseUrl: string | null;

  /** API-ключ провайдера */
  @Column('text', {
    name: 'api_key',
    nullable: true,
  })
  public apiKey: string | null;

  /** Лимит токенов (для chat-моделей) */
  @Column('integer', {
    name: 'max_tokens',
    nullable: true,
  })
  public maxTokens: number | null;

  /** Участвует ли агент в выборе */
  @Column('boolean', {
    name: 'is_active',
    default: true,
  })
  public isActive: boolean;
}
