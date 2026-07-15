import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { AiPromptTypeEnum } from '@server/types/ai/enums/ai-prompt-type.enum';

/** Шаблон промпта AI (pre-validation) */
@Entity({
  name: 'prompt_template',
  schema: 'ai',
})
export class AiPromptTemplateEntity extends BaseEntity {
  /** Уникальный id шаблона */
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

  /** Тип шаблона */
  @Column({
    type: 'enum',
    enum: AiPromptTypeEnum,
    enumName: 'prompt_template_type_enum',
  })
  public type: AiPromptTypeEnum;

  /** Краткое описание для SQL-правки */
  @Column('character varying', {
    nullable: true,
  })
  public title: string | null;

  /** Текст промпта с плейсхолдерами */
  @Column('text')
  public content: string;

  /** Активная версия */
  @Column('boolean', {
    name: 'is_active',
    default: true,
  })
  public isActive: boolean;
}
