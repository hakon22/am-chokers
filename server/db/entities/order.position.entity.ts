import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  AfterLoad,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { OrderEntity } from '@server/db/entities/order.entity';

/** Позиция заказа */
@Entity({
  name: 'order_position',
})
export class OrderPositionEntity extends BaseEntity {
  /** Уникальный id позиции заказа */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания позиции */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения позиции */
  @UpdateDateColumn()
  public updated: Date;

  /** Удалена */
  @DeleteDateColumn()
  public deleted: Date;

  /** Товар */
  @ManyToOne(() => ItemEntity)
  @JoinColumn({
    name: 'item_id',
    referencedColumnName: 'id',
  })
  public item: ItemEntity;

  /** Цена */
  @Column('numeric')
  public price: number;

  /** Скидка */
  @Column('numeric')
  public discount: number;

  /** Количество */
  @Column('int')
  public count: number;

  /** Заказ */
  @ManyToOne(() => OrderEntity)
  @JoinColumn({
    name: 'order_id',
    referencedColumnName: 'id',
  })
  public order: OrderEntity;

  @AfterLoad()
  transform() {
    this.price = +this.price;
    this.discount = +this.discount;
  }
}
