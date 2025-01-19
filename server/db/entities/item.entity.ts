import {
  Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  OneToMany,
  ManyToMany,
  OneToOne,
} from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { RatingEntity } from '@server/db/entities/rating.entity';
import { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { UserEntity } from '@server/db/entities/user.entity';

/** Товар */
@Entity({
  name: 'item',
})
export class ItemEntity extends BaseEntity {
  /** Уникальный `id` товара */
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

  /** Дата удаления товара */
  @Column('timestamp with time zone', {
    nullable: true,
  })
  public deleted: Date | null;

  /** Цена товара */
  @Column('int')
  public price: number;

  /** Скидка на товар (в `процентах`) */
  @Column('int', {
    default: 0,
  })
  public discount: number;

  /** Скидка на товар (в `рублях`) */
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

  /** Классы товара (для компонента ImageHover) */
  @Column('character varying', {
    name: 'class_name',
    default: 'me-3',
  })
  public className: string;

  /** Позиция на главной странице */
  @Column('int', {
    nullable: true,
  })
  public order: number;

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
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'collection_id',
  })
  public collection?: ItemCollectionEntity;

  /** Пользователи, добавившие товар в избранное */
  @ManyToMany(() => UserEntity, user => user.favorites)
  public users: UserEntity[];

  /** Рейтинг товара */
  @OneToOne(() => RatingEntity, rating => rating.item)
  public rating?: RatingEntity;

  /** Оценки товара */
  @OneToMany(() => ItemGradeEntity, itemGrade => itemGrade.item)
  public grades: ItemGradeEntity[];
}
