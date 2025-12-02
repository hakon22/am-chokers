import {
  Entity, Column, PrimaryGeneratedColumn, JoinColumn, ManyToOne, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  OneToMany,
  ManyToMany,
  OneToOne,
  JoinTable,
  Index,
} from 'typeorm';

import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { RatingEntity } from '@server/db/entities/rating.entity';
import { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { UserEntity } from '@server/db/entities/user.entity';
import { CompositionEntity } from '@server/db/entities/composition.entity';
import { ColorEntity } from '@server/db/entities/color.entity';
import { MessageEntity } from '@server/db/entities/message.entity';
import { PromotionalEntity } from '@server/db/entities/promotional.entity';
import { ItemTranslateEntity } from '@server/db/entities/item.translate.entity';
import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';

/** Товар */
@Entity({
  name: 'item',
})
export class ItemEntity extends BaseEntity {
  /** Уникальный `id` товара */
  @PrimaryGeneratedColumn()
  public id: number;

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
    name: 'discount_price',
  })
  public discountPrice: number;

  /** Фотографии товара */
  @OneToMany(() => ImageEntity, image => image.item)
  public images: ImageEntity[];

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

  /** Временно отсутствующий товар */
  @Column('boolean', {
    default: false,
    name: 'is_absent',
  })
  public isAbsent: boolean;

  /** Имя товара в транслите */
  @Index()
  @Column('character varying', {
    name: 'translate_name',
    unique: true,
  })
  public translateName: string;

  /** Позиция на главной странице */
  @Column('int', {
    nullable: true,
  })
  public order: number;

  /** Группа товара */
  @Index()
  @ManyToOne(() => ItemGroupEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'group_id',
  })
  public group: ItemGroupEntity;

  /** Коллекция товара */
  @Index()
  @ManyToOne(() => ItemCollectionEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'collection_id',
  })
  public collection?: ItemCollectionEntity | null;

  /** Состав товара (в описании) */
  @ManyToMany(() => CompositionEntity, composition => composition.items)
  @JoinTable({
    name: 'item_composition',
    joinColumn: {
      name: 'item_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'composition_id',
      referencedColumnName: 'id',
    },
  })
  public compositions: CompositionEntity[];

  /** Цвет товара (в описании) */
  @ManyToMany(() => ColorEntity, color => color.items)
  @JoinTable({
    name: 'item_color',
    joinColumn: {
      name: 'item_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'color_id',
      referencedColumnName: 'id',
    },
  })
  public colors: ColorEntity[];

  /** Пользователи, добавившие товар в избранное */
  @ManyToMany(() => UserEntity, user => user.favorites)
  public users: UserEntity[];

  /** Промокоды, которые действуют на данную позицию */
  @ManyToMany(() => PromotionalEntity, promotional => promotional.items)
  public promotionals: PromotionalEntity[];

  /** Рейтинг товара */
  @OneToOne(() => RatingEntity, rating => rating.item)
  public rating?: RatingEntity;

  /** Оценки товара */
  @OneToMany(() => ItemGradeEntity, itemGrade => itemGrade.item)
  public grades: ItemGradeEntity[];

  /** Сообщение о публикации товара в группу Telegram */
  @Index()
  @ManyToOne(() => MessageEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'message_id',
  })
  public message?: MessageEntity | null;

  /** Отложенная публикация товара в группу Telegram */
  @OneToOne(() => DeferredPublicationEntity, deferredPublication => deferredPublication.item)
  public deferredPublication?: DeferredPublicationEntity | null;

  /** Локализации товара */
  @OneToMany(() => ItemTranslateEntity, translate => translate.item)
  public translations: ItemTranslateEntity[];

  /** Дата публикации товара */
  @Column('timestamp without time zone', {
    name: 'publication_date',
    nullable: true,
  })
  public publicationDate: Date | null;
}
