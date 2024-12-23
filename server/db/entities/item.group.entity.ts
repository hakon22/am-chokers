import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/** Группы товаров */
@Entity({
  name: 'item_group',
})
@Unique(['code'])
export class ItemGroupEntity extends BaseEntity {
  /** Уникальный `id` группы товара */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя группы товара */
  @Column('character varying')
  public name: string;

  /** Дата создания группы товара */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения группы товара */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления группы товара */
  @DeleteDateColumn()
  public deleted: Date;

  /** Описание группы товара */
  @Column('character varying')
  public description: string;

  /** Код группы товара (отображается в url) */
  @Column('character varying')
  public code: string;
}
