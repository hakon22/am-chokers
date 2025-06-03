import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { OrderEntity } from '@server/db/entities/order.entity';

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

  /** Заказы */
  @OneToMany(() => OrderEntity, order => order.promotional)
  public orders: OrderEntity[];
}
