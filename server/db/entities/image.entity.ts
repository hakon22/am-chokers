import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  AfterLoad,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';


import { ItemEntity } from '@server/db/entities/item.entity';
import { CommentEntity } from '@server/db/entities/comment.entity';

/** Изображения */
@Entity({
  name: 'image',
})
export class ImageEntity extends BaseEntity {
  /** Уникальный `id` изображения */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя изображения */
  @Column('character varying')
  public name: string;

  /** Дата создания изображения */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения изображения */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления изображения */
  @DeleteDateColumn()
  public deleted: Date;

  /** Путь изображения */
  @Column('character varying')
  public path: string;

  /** Очерёдность сортировки */
  @Column('int', {
    nullable: true,
  })
  public order: number;

  /** Порядок установки на главной странице */
  @Column('int', {
    nullable: true,
    name: 'cover_order',
  })
  public coverOrder?: number;

  /** Товар изображения */
  @Index()
  @ManyToOne(() => ItemEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  /** Комментарий изображения */
  @Index()
  @ManyToOne(() => CommentEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'comment_id',
  })
  public comment: CommentEntity;

  /** Полный путь изображения для вставки */
  public src: string;

  @AfterLoad()
  genSrc() {
    this.src = [this.path, this.name].join('/').replaceAll('\\', '/');
  }
}
