import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/** Группы товаров */
@Entity({
  name: 'item_group',
})
export class ItemGroupEntity {
  /** Уникальный id группы товара */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя группы товара */
  @Column('character varying')
  public name: string;

  /** Описание группы товара */
  @Column('character varying')
  public description: string;

  /** Код группы товара (отображается в url) */
  @Column('character varying')
  public code: string;
}
