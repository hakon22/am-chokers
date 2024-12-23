import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

import { ImageEntity } from '@server/db/entities/image.entity';
import { UserEntity } from '@server/db/entities/user.entity';

/** Комментарии */
@Entity({
  name: 'comment',
})
export class CommentEntity extends BaseEntity {
  /** Уникальный `id` комментария */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания комментария */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения комментария */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления комментария */
  @DeleteDateColumn()
  public deleted: Date;

  /** Текст комментария */
  @Column('text')
  public text: string;

  /** Ответ на комментарий */
  @ManyToOne(() => CommentEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'reply_id',
  })
  public reply?: CommentEntity;

  /** Создатель комментария */
  @ManyToOne(() => UserEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity;

  /** Фотографии комментария */
  @OneToMany(() => ImageEntity, image => image.comment)
  public images: ImageEntity[];
}
