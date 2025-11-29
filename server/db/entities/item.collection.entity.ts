import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, DeleteDateColumn, UpdateDateColumn, CreateDateColumn, OneToMany } from 'typeorm';

import { ItemCollectionTranslateEntity } from '@server/db/entities/item.collection.translate.entity';

/** Коллекции товаров */
@Entity({
  name: 'item_collection',
})
export class ItemCollectionEntity extends BaseEntity {
  /** Уникальный `id` коллекции */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания коллекции */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения коллекции */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления коллекции */
  @DeleteDateColumn()
  public deleted: Date | null;

  /** Описание коллекции */
  @Column('character varying')
  public description: string;

  /** Локализации коллекции */
  @OneToMany(() => ItemCollectionTranslateEntity, translate => translate.collection)
  public translations: ItemCollectionTranslateEntity[];
}
