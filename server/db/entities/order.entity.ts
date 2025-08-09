import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserEntity } from '@server/db/entities/user.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { PromotionalEntity } from '@server/db/entities/promotional.entity';
import { DeliveryEntity } from '@server/db/entities/delivery.entity';
import { AcquiringTransactionEntity } from '@server/db/entities/acquiring.transaction.entity';

/** Заказ */
@Entity({
  name: 'order',
})
export class OrderEntity extends BaseEntity {
  /** Уникальный `id` заказа */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания заказа */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения заказа */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления заказа */
  @DeleteDateColumn()
  public deleted: Date;

  /** Статус заказа */
  @Column('enum', {
    enum: OrderStatusEnum,
    default: OrderStatusEnum.NOT_PAID,
  })
  public status: OrderStatusEnum;

  /** Покупатель */
  @Index()
  @ManyToOne(() => UserEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity;

  /** Стоимость доставки */
  @Column('float', {
    name: 'delivery_price',
  })
  public deliveryPrice: number;

  /** Промокод */
  @Index()
  @ManyToOne(() => PromotionalEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'promotional_id',
  })
  public promotional?: PromotionalEntity;

  /** Доставка */
  @Index()
  @ManyToOne(() => DeliveryEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'delivery_id',
  })
  public delivery: DeliveryEntity;

  /** Комментарий к заказу */
  @Column('character varying', {
    nullable: true,
  })
  public comment: string;

  /** Позиции */
  @OneToMany(() => OrderPositionEntity, orderPosition => orderPosition.order)
  public positions: OrderPositionEntity[];

  /** Транзакции */
  @OneToMany(() => AcquiringTransactionEntity, transaction => transaction.order)
  public transactions: AcquiringTransactionEntity[];
}
