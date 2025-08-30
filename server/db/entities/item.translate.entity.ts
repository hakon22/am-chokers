import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация товара */
@Entity({
  name: 'item_translate',
})
@Unique(['lang', 'item'])
export class ItemTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя товара */
  @Column('character varying')
  public name: string;

  /** Описание товара */
  @Column('character varying')
  public description: string;

  /** Длина товара (в описании) */
  @Column('character varying')
  public length: string;

  /** Товар */
  @Index()
  @ManyToOne(() => ItemEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
