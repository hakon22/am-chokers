import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';
import { ItemEntity } from '@server/db/entities/item.entity';

/** Корзина товаров */
@Entity({
  name: 'cart',
})
export class CartEntity extends BaseEntity {
  /** Уникальный `id` позиции корзины */
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  /** Дата создания позиции корзины */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения позиции корзины */
  @UpdateDateColumn()
  public updated: Date;

  /** Количество */
  @Column('int')
  public count: number;

  /** Позиция */
  @ManyToOne(() => ItemEntity)
  @JoinColumn({
    name: 'item_id',
    referencedColumnName: 'id',
  })
  public item: ItemEntity;

  /** Пользователь */
  @ManyToOne(() => UserEntity, {
    nullable: true,
  })
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  public user?: UserEntity;
}
