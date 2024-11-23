import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, DeleteDateColumn } from 'typeorm';

/** Коллекции товаров */
@Entity({
  name: 'item_collection',
})
export class ItemCollectionEntity extends BaseEntity {
  /** Уникальный id коллекции */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя коллекции */
  @Column('character varying')
  public name: string;

  /** Описание коллекции */
  @Column('character varying')
  public description: string;

  /** Удалена */
  @DeleteDateColumn()
  public deleted: Date;
}
