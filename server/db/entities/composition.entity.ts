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
  name: 'composition',
})
@Unique(['name'])
export class CompositionEntity extends BaseEntity {
  /** Уникальный `id` компонента */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя компонента */
  @Column('character varying')
  public name: string;

  /** Дата создания компонента */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения компонента */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления компонента */
  @DeleteDateColumn()
  public deleted: Date;

  /** Товары, которые включают данный компонент */
  @ManyToMany(() => ItemEntity, item => item.compositions)
  public items: ItemEntity[];
}
