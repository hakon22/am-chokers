import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация группы товара */
@Entity({
  name: 'item_group_translate',
})
@Unique(['lang', 'group'])
export class ItemGroupTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя группы товара */
  @Column('character varying')
  public name: string;

  /** Описание группы товара */
  @Column('character varying')
  public description: string;

  /** Группа товара */
  @Index('item_group_translate__group_idx')
  @ManyToOne(() => ItemGroupEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'group_id',
  })
  public group: ItemGroupEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
