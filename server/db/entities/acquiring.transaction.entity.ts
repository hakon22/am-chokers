import { BaseEntity, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { TransactionStatusEnum } from '@server/types/acquiring/enums/transaction.status.enum';
import { OrderEntity } from '@server/db/entities/order.entity';
import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';

/** Транзакции эквайринга */
@Entity({
  name: 'acquiring_transaction',
})
export class AcquiringTransactionEntity extends BaseEntity {
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
  @Index()
  @Column('character varying', {
    name: 'transaction_id',
  })
  public transactionId: string;

  /** Уникальная ссылка на оплату заказа */
  @Column('character varying')
  public url: string;

  /** Сумма оплаты */
  @Column('float')
  public amount: number;

  /** Статус транзакции */
  @Column({
    type: 'enum',
    enum: TransactionStatusEnum,
    default: TransactionStatusEnum.CREATE,
  })
  public status: TransactionStatusEnum;

  /** Тип транзакции */
  @Column({
    type: 'enum',
    enum: AcquiringTypeEnum,
  })
  public type: AcquiringTypeEnum;

  /** Заказ */
  @Index()
  @ManyToOne(() => OrderEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
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
