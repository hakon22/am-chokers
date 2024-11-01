/* eslint-disable import/no-cycle */
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { UserEntity } from '@server/db/entities/user.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';

/** Заказ */
@Entity({
  name: 'order',
})
export class OrderEntity extends BaseEntity {
  /** Уникальный id заказа */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания заказа */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения заказа */
  @UpdateDateColumn()
  public updated: Date;

  /** Удалён */
  @DeleteDateColumn()
  public deleted: Date;

  /** Статус заказа */
  @Column('enum', {
    enum: OrderStatusEnum,
    default: OrderStatusEnum.NEW,
  })
  public status: OrderStatusEnum;

  /** Покупатель */
  @ManyToOne(() => UserEntity, {
    nullable: false,
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  public user: UserEntity;

  /** Позиции */
  @OneToMany(() => OrderPositionEntity, (orderPosition) => orderPosition.order)
  public positions: OrderPositionEntity[];
}
