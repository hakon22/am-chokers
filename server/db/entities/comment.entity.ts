import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { ImageEntity } from '@server/db/entities/image.entity';
import { UserEntity } from '@server/db/entities/user.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';

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

  /** Ответные комментарии */
  @OneToMany(() => CommentEntity, reply => reply.parentComment)
  public replies: CommentEntity[];

  /** Родительский комментарий */
  @ManyToOne(() => CommentEntity, parent => parent.replies)
  @JoinColumn({
    name: 'parent_comment_id',
  })
  public parentComment: CommentEntity;

  /** Оценка позиции */
  @OneToOne(() => GradeEntity, grade => grade.comment)
  public grade?: GradeEntity;
}
