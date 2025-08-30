import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { CompositionEntity } from '@server/db/entities/composition.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация компонентов */
@Entity({
  name: 'composition_translate',
})
@Unique(['lang', 'composition'])
export class CompositionTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя компонента */
  @Column('character varying')
  public name: string;

  /** Компонент */
  @Index()
  @ManyToOne(() => CompositionEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'composition_id',
  })
  public composition: CompositionEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
