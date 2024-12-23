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
    default: OrderStatusEnum.NEW,
  })
  public status: OrderStatusEnum;

  /** Покупатель */
  @ManyToOne(() => UserEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity;

  /** Позиции */
  @OneToMany(() => OrderPositionEntity, orderPosition => orderPosition.order)
  public positions: OrderPositionEntity[];
}
