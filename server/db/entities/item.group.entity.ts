import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  Unique,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { ItemGroupTranslateEntity } from '@server/db/entities/item.group.translate.entity';

/** Группы товаров */
@Entity({
  name: 'item_group',
})
@Unique(['code'])
export class ItemGroupEntity extends BaseEntity {
  /** Уникальный `id` группы товара */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания группы товара */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения группы товара */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления группы товара */
  @DeleteDateColumn()
  public deleted: Date;

  /** Код группы товара (отображается в url) */
  @Column('character varying', { unique: true })
  public code: string;

  /** Очерёдность сортировки */
  @Column('smallint', {
    default: 0,
  })
  public order: number;

  /** Локализации группы товара */
  @OneToMany(() => ItemGroupTranslateEntity, translate => translate.group)
  public translations: ItemGroupTranslateEntity[];
}
