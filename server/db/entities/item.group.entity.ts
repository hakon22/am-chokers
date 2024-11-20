import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

/** Группы товаров */
@Entity({
  name: 'item_group',
})
@Unique(['code'])
export class ItemGroupEntity extends BaseEntity {
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

  /** Удалёна */
  @DeleteDateColumn()
  public deleted: Date;
}
