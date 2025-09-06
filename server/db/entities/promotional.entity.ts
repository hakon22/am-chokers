import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';

import { OrderEntity } from '@server/db/entities/order.entity';
import { ItemEntity } from '@server/db/entities/item.entity';

/** Промокоды */
@Entity({
  name: 'promotional',
})
export class PromotionalEntity extends BaseEntity {
  /** Уникальный `id` промокода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания промокода */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения промокода */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления промокода */
  @DeleteDateColumn()
  public deleted: Date;

  /** Имя промокода */
  @Column('character varying')
  public name: string;

  /** Описание промокода */
  @Column('character varying')
  public description: string;

  /** Скидка промокода */
  @Column('int', {
    nullable: true,
  })
  public discount: number;

  /** Скидка промокода в процентах */
  @Column('int', {
    nullable: true,
    name: 'discount_percent',
  })
  public discountPercent: number;

  /** Бесплатная доставка */
  @Column('boolean', {
    default: false,
    name: 'free_delivery',
  })
  public freeDelivery: boolean;

  /** Старт действия промокода */
  @Column('date')
  public start: Date;

  /** Конец действия промокода */
  @Column('date')
  public end: Date;

  /** Активен */
  @Column('boolean', {
    default: true,
  })
  public active: boolean;

  /** Товары, на которых действует данный промокод */
  @ManyToMany(() => ItemEntity, item => item.promotionals)
  @JoinTable({
    name: 'promotional_item',
    joinColumn: {
      name: 'promotional_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'item_id',
      referencedColumnName: 'id',
    },
  })
  public items: ItemEntity[];

  /** Заказы */
  @OneToMany(() => OrderEntity, order => order.promotional)
  public orders: OrderEntity[];
}
