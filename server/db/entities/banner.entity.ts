import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { ImageEntity } from '@server/db/entities/image.entity';

/** Баннеры */
@Entity({
  name: 'banner',
})
export class BannerEntity extends BaseEntity {
  /** Уникальный `id` баннера */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания баннера */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения баннера */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления баннера */
  @DeleteDateColumn()
  public deleted: Date;

  /** Название баннера */
  @Column('character varying')
  public name: string;

  /** Ссылка для перехода */
  @Column('character varying', {
    nullable: true,
  })
  public link?: string | null;

  /** Значение для копирования */
  @Column('character varying', {
    nullable: true,
    name: 'copy_value',
  })
  public copyValue?: string | null;

  /** Очерёдность сортировки */
  @Column('smallint', {
    default: 0,
  })
  public order: number;

  /** Видео для десктопа */
  @ManyToOne(() => ImageEntity, {
    nullable: false,
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'desktop_video_id',
  })
  public desktopVideo: ImageEntity;

  /** Видео для мобильных устройств */
  @ManyToOne(() => ImageEntity, {
    nullable: false,
    onUpdate: 'CASCADE',
  })
  @JoinColumn({
    name: 'mobile_video_id',
  })
  public mobileVideo: ImageEntity;
}
