import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';

/** Отложенные публикации */
@Entity({
  name: 'deferred_publication',
})
export class DeferredPublicationEntity extends BaseEntity {
  /** Уникальный `id` отложенной публикации */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания отложенной публикации */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения отложенной публикации */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления отложенной публикации */
  @DeleteDateColumn()
  public deleted: Date | null;

  /** Дата отложенной публикации */
  @Column('timestamp without time zone')
  public date: Date;

  /** Описание товара */
  @Column('character varying')
  public description: string;

  /** Статус отложенной публикации */
  @Column('boolean', {
    name: 'is_published',
    default: false,
  })
  public isPublished: boolean;

  /** Товар */
  @Index('deferred_publication__item_idx')
  @ManyToOne(() => ItemEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;
}
