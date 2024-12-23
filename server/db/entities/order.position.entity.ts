import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { OrderEntity } from '@server/db/entities/order.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';

/** Позиция заказа */
@Entity({
  name: 'order_position',
})
export class OrderPositionEntity extends BaseEntity {
  /** Уникальный `id` позиции заказа */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания позиции */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения позиции */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления позиции */
  @DeleteDateColumn()
  public deleted: Date;

  /** Товар */
  @ManyToOne(() => ItemEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  /** Цена позиции заказа */
  @Column('numeric', {
    transformer: {
      from: (value) => +value,
      to: (value) => +value,
    },
  })
  public price: number;

  /** Скидка на позицию заказа (в `процентах`) */
  @Column('int', {
    default: 0,
  })
  public discount: number;

  /** Скидка на позицию заказа (в `рублях`) */
  @Column('int', {
    default: 0,
  })
  public discountPrice: number;

  /** Количество */
  @Column('int')
  public count: number;

  /** Заказ */
  @ManyToOne(() => OrderEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'order_id',
  })
  public order: OrderEntity;

  /** Оценка */
  @ManyToOne(() => GradeEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'grade_id',
  })
  public grade?: GradeEntity;
}
