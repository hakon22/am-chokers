import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';

/** Маппинг группы каталога → тип AI-примерки */
@Entity({
  name: 'item_group_try_on',
  schema: 'ai',
})
export class AiItemGroupTryOnEntity extends BaseEntity {
  /** Уникальный id записи */
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

  /** Группа каталога */
  @Index('item_group_try_on__item_group_id__idx')
  @OneToOne(() => ItemGroupEntity, (itemGroup) => itemGroup.tryOn, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_group_id',
  })
  public itemGroup: ItemGroupEntity;

  /** Тип VTO (NULL для отключённых групп) */
  @Column({
    type: 'enum',
    enum: AiTryOnVtoTypeEnum,
    enumName: 'try_on_vto_type_enum',
    name: 'vto_type',
    nullable: true,
  })
  public vtoType: AiTryOnVtoTypeEnum | null;

  /** Override system-промпта validation */
  @Column({
    type: 'enum',
    enum: AiPromptTypeEnum,
    enumName: 'prompt_template_type_enum',
    name: 'validation_prompt_type',
    nullable: true,
  })
  public validationPromptType: AiPromptTypeEnum | null;

  /** Доступна ли примерка для группы */
  @Column('boolean', {
    name: 'is_enabled',
    default: true,
  })
  public isEnabled: boolean;
}
