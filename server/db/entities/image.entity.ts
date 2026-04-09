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
import { CoverTypeEnum } from '@server/utilities/enums/cover.type.enum';

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

  /** Версия сайта для обложки */
  @Column('smallint', {
    nullable: true,
    name: 'site_version',
  })
  public siteVersion?: number;

  /** Тип обложки */
  @Column({
    type: 'enum',
    enum: CoverTypeEnum,
    nullable: true,
    name: 'cover_type',
  })
  public coverType?: CoverTypeEnum;

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

  /** JPEG превью для mp4 (`имя.poster.jpg` рядом с файлом), если сгенерировано при загрузке */
  public posterSrc?: string;

  @AfterLoad()
  genSrc() {
    this.src = [this.path, this.name].join('/').replaceAll('\\', '/');
    if (/\.mp4$/i.test(this.name)) {
      const posterName = this.name.replace(/\.mp4$/i, '.poster.jpg');
      this.posterSrc = [this.path, posterName].join('/').replaceAll('\\', '/');
    } else {
      this.posterSrc = undefined;
    }
  }
}
