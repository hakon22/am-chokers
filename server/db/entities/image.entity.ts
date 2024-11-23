import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';


import { ItemEntity } from '@server/db/entities/item.entity';

/** Изображения */
@Entity({
  name: 'image',
})
export class ImageEntity extends BaseEntity {
  /** Уникальный id изображения */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя изображения */
  @Column('character varying')
  public name: string;

  /** Путь изображения */
  @Column('character varying')
  public path: string;

  /** Удалена */
  @DeleteDateColumn()
  public deleted: Date;

  /** Сортировка */
  @Column('int', {
    nullable: true,
  })
  public order: number;

  /** Товар изображения */
  @ManyToOne(() => ItemEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;
}
