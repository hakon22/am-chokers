import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, AfterLoad, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';
import { ItemEntity } from '@server/db/entities/item.entity';

/** Корзина товаров */
@Entity({
  name: 'cart',
})
export class CartEntity extends BaseEntity {
  /** Уникальный id позиции корзины */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя товара */
  @Column('character varying')
  public name: string;

  /** Дата создания позиции корзины */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения позиции корзины */
  @UpdateDateColumn()
  public updated: Date;

  /** Цена */
  @Column('numeric')
  public price: number;

  /** Скидка */
  @Column('int', {
    default: 0,
  })
  public discount: number;

  /** Цена со скидкой */
  @Column('int', {
    default: 0,
  })
  public discountPrice: number;

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
  @ManyToOne(() => UserEntity)
  @JoinColumn({
    name: 'user_id',
    referencedColumnName: 'id',
  })
  public user: UserEntity;

  @AfterLoad()
  transform() {
    this.price = +this.price;
  }
}
