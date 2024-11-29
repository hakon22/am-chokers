import {
  Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  OneToMany,
  DeleteDateColumn,
} from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { ImageEntity } from '@server/db/entities/image.entity';

/** Товар */
@Entity({
  name: 'item',
})
export class ItemEntity extends BaseEntity {
  /** Уникальный id товара */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя товара */
  @Column('character varying')
  public name: string;

  /** Описание товара */
  @Column('character varying')
  public description: string;

  /** Дата создания товара */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения товара */
  @UpdateDateColumn()
  public updated: Date;

  /** Удалён */
  @DeleteDateColumn()
  public deleted: Date;

  /** Цена товара */
  @Column('int')
  public price: number;

  /** Скидка товара */
  @Column('int', {
    default: 0,
  })
  public discount: number;

  /** Цена товара со скидкой */
  @Column('int', {
    default: 0,
  })
  public discountPrice: number;

  /** Фотографии товара */
  @OneToMany(() => ImageEntity, image => image.item)
  public images: ImageEntity[];

  /** Высота картинки товара */
  @Column('int')
  public height: number;

  /** Ширирна картинки товара */
  @Column('int')
  public width: number;

  /** Состав товара (в описании) */
  @Column('character varying')
  public composition: string;

  /** Длина товара (в описании) */
  @Column('character varying')
  public length: string;

  /** Рейтинг товара */
  @Column('numeric', {
    default: 0,
  })
  public rating: number;

  /** Бестселлер */
  @Column('boolean', {
    default: false,
  })
  public bestseller: boolean;

  /** Новинка */
  @Column('boolean', {
    default: false,
  })
  public new: boolean;

  /** Позиция на главной странице */
  @Column('int', {
    nullable: true,
  })
  public order: number;

  /** Классы товара (для компонента ImageHover) */
  @Column('character varying', {
    name: 'class_name',
    default: 'me-3',
  })
  public className: string;

  /** Группа товара */
  @ManyToOne(() => ItemGroupEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'group_id',
  })
  public group: ItemGroupEntity;

  /** Коллекция товара */
  @ManyToOne(() => ItemCollectionEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'collection_id',
  })
  public collection: ItemCollectionEntity;
}
