import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  AfterLoad,
} from 'typeorm';
import _ from 'lodash';

import { ItemEntity } from '@server/db/entities/item.entity';
import { UserEntity } from '@server/db/entities/user.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { AiAgentEntity } from '@server/db/entities/ai/ai-agent.entity';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { AiTryOnLogStatusEnum } from '@server/types/ai/enums/ai-try-on-log-status.enum';
import { AiProviderTypeEnum } from '@server/types/ai/enums/ai-provider-type.enum';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Журнал запросов AI-примерки */
@Entity({
  name: 'try_on_log',
  schema: 'ai',
})
export class AiTryOnLogEntity extends BaseEntity {
  /** Уникальный id лога */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата и время запроса */
  @CreateDateColumn()
  public created: Date;

  /** Товар */
  @Index('try_on_log__item_id__idx')
  @ManyToOne(() => ItemEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  /** Тип примерки */
  @Column({
    type: 'enum',
    enum: AiTryOnVtoTypeEnum,
    enumName: 'try_on_vto_type_enum',
    name: 'vto_type',
  })
  public vtoType: AiTryOnVtoTypeEnum;

  /** Пользователь (NULL для гостя) */
  @Index('try_on_log__user_id__idx')
  @ManyToOne(() => UserEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity | null;

  /** Статус запроса */
  @Column({
    type: 'enum',
    enum: AiTryOnLogStatusEnum,
    enumName: 'try_on_log_status_enum',
  })
  public status: AiTryOnLogStatusEnum;

  /** Результат pre-validation */
  @Column('boolean')
  public suitable: boolean;

  /** Текст отказа / reason от AI */
  @Column('text', {
    name: 'validation_reason',
    nullable: true,
  })
  public validationReason: string | null;

  /** Провайдер validation */
  @Column({
    type: 'enum',
    enum: AiProviderTypeEnum,
    enumName: 'provider_type_enum',
    name: 'validation_provider',
    nullable: true,
  })
  public validationProvider: AiProviderTypeEnum | null;

  /** Провайдер generation */
  @Column({
    type: 'enum',
    enum: AiProviderTypeEnum,
    enumName: 'provider_type_enum',
    name: 'generation_provider',
    nullable: true,
  })
  public generationProvider: AiProviderTypeEnum | null;

  /** Стоимость validation, ₽ */
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'validation_cost',
    nullable: true,
  })
  public validationCost: number | null;

  /** Стоимость generation, ₽ */
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'generation_cost',
    nullable: true,
  })
  public generationCost: number | null;

  /** Суммарная стоимость, ₽ */
  @Column('numeric', {
    precision: 10,
    scale: 2,
    name: 'total_cost',
    nullable: true,
  })
  public totalCost: number | null;

  /** Папка результата (try-on) */
  @Column('character varying', {
    name: 'result_image_path',
    nullable: true,
  })
  public resultImagePath: string | null;

  /** Имя файла результата */
  @Column('character varying', {
    name: 'result_image_name',
    nullable: true,
  })
  public resultImageName: string | null;

  /** Полный URL результата для вставки (собирается в AfterLoad) */
  public resultImageSrc?: string;

  /** Оценка пользователя */
  @Column({
    type: 'enum',
    enum: AiTryOnUserRatingEnum,
    enumName: 'try_on_user_rating_enum',
    name: 'user_rating',
    nullable: true,
  })
  public userRating: AiTryOnUserRatingEnum | null;

  /** Когда поставлена оценка */
  @Column('timestamp', {
    name: 'user_rated_at',
    nullable: true,
  })
  public userRatedAt: Date | null;

  /** Агент validation */
  @Index('try_on_log__validation_agent_id__idx')
  @ManyToOne(() => AiAgentEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'validation_agent_id',
  })
  public validationAgent: AiAgentEntity | null;

  /** Агент generation */
  @Index('try_on_log__generation_agent_id__idx')
  @ManyToOne(() => AiAgentEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'generation_agent_id',
  })
  public generationAgent: AiAgentEntity | null;

  /** Длительность обработки, мс */
  @Column('integer', {
    name: 'duration_ms',
    nullable: true,
  })
  public durationMs: number | null;

  /** SHA-256 хеш IP + salt */
  @Column('character varying', {
    name: 'ip_hash',
    length: 64,
  })
  public ipHash: string;

  /** Язык клиента */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
    name: 'user_lang',
    nullable: true,
  })
  public userLang: UserLangEnum | null;

  /** Техническая ошибка */
  @Column('text', {
    name: 'error_message',
    nullable: true,
  })
  public errorMessage: string | null;

  /** Изображение товара, использованное для AI-примерки */
  @Index('try_on_log__try_on_image_id__idx')
  @ManyToOne(() => ImageEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'try_on_image_id',
  })
  public tryOnImage: ImageEntity | null;

  /** Собирает публичный путь к результату примерки */
  @AfterLoad()
  public generateResultImageSrc(): void {
    if (_.isNil(this.resultImagePath) || _.isNil(this.resultImageName)) {
      this.resultImageSrc = undefined;
      return;
    }

    this.resultImageSrc = [this.resultImagePath, this.resultImageName].join('/').replaceAll('\\', '/');
  }
}
