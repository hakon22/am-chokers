import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';

/** Компоненты */
@Entity({
  name: 'color',
})
@Unique(['hex'])
export class ColorEntity extends BaseEntity {
  /** Уникальный `id` цвета */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя цвета */
  @Column('character varying')
  public name: string;

  /** Код цвета */
  @Column('character varying')
  public hex: string;

  /** Дата создания цвета */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения цвета */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления цвета */
  @DeleteDateColumn()
  public deleted: Date;

  /** Товары, которые включают данный цвет */
  @ManyToMany(() => ItemEntity, item => item.compositions)
  public items: ItemEntity[];
}
