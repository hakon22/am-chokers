import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, DeleteDateColumn, UpdateDateColumn, CreateDateColumn, Unique } from 'typeorm';

/** Коллекции товаров */
@Entity({
  name: 'item_collection',
})
@Unique(['name'])
export class ItemCollectionEntity extends BaseEntity {
  /** Уникальный `id` коллекции */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя коллекции */
  @Column('character varying')
  public name: string;

  /** Дата создания коллекции */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения коллекции */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления коллекции */
  @DeleteDateColumn()
  public deleted: Date;

  /** Описание коллекции */
  @Column('character varying')
  public description: string;
}
