import {
  Entity, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { CompositionTranslateEntity } from '@server/db/entities/composition.translate.entity';

/** Компоненты */
@Entity({
  name: 'composition',
})
export class CompositionEntity extends BaseEntity {
  /** Уникальный `id` компонента */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания компонента */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения компонента */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления компонента */
  @DeleteDateColumn()
  public deleted: Date | null;

  /** Товары, которые включают данный компонент */
  @ManyToMany(() => ItemEntity, item => item.compositions)
  public items: ItemEntity[];

  /** Локализации компонента */
  @OneToMany(() => CompositionTranslateEntity, translate => translate.composition)
  public translations: CompositionTranslateEntity[];
}
