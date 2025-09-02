import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация коллекции товара */
@Entity({
  name: 'item_collection_translate',
})
@Unique(['lang', 'collection'])
export class ItemCollectionTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя коллекции товара */
  @Column('character varying')
  public name: string;

  /** Коллекция товара */
  @Index('item_collection_translate__collection_idx')
  @ManyToOne(() => ItemCollectionEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'collection_id',
  })
  public collection: ItemCollectionEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
