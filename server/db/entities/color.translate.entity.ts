import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { ColorEntity } from '@server/db/entities/color.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация цветов */
@Entity({
  name: 'color_translate',
})
@Unique(['lang', 'color'])
export class ColorTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя цвета */
  @Column('character varying')
  public name: string;

  /** Цвет */
  @Index()
  @ManyToOne(() => ColorEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'color_id',
  })
  public color: ColorEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
