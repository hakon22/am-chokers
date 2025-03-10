import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { OrderEntity } from '@server/db/entities/order.entity';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';

/** Транзакции эквайринга */
@Entity({
  name: 'payment_transaction',
})
export class PaymentTransactionEntity extends BaseEntity {
  /** Уникальный `id` транзакции (внутренний) */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания транзакции */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения транзакции */
  @UpdateDateColumn()
  public updated: Date;

  /** Уникальный `id` транзакции (внешний) */
  @Column('character varying', {
    name: 'transaction_id',
    nullable: false,
  })
  public transactionId: string;

  /** Уникальная ссылка на оплату заказа */
  @Column('character varying', {
    nullable: false,
  })
  public url: string;

  /** Сумма оплаты */
  @Column('float', {
    nullable: false,
  })
  public amount: number;

  /** Статус транзакции */
  @Column({
    type: 'enum',
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.CREATE,
    nullable: false,
  })
  public status: TransactionStatusEnum;

  /** Тип транзакции */
  @Column({
    type: 'enum',
    enum: AcquiringTypeEnum,
    nullable: false,
  })
  public type: AcquiringTypeEnum;

  /** Заказ */
  @ManyToOne(() => OrderEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'order_id',
  })
  public order: OrderEntity;

  /** Причина отказа */
  @Column({
    type: 'text',
    nullable: true,
  })
  public reason: string;
}
