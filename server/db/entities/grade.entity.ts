import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';
import { CommentEntity } from '@server/db/entities/comment.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';

/** Оценки товаров */
@Entity({
  name: 'grade',
})
export class GradeEntity extends BaseEntity {
  /** Уникальный `id` оценки */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания оценки */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения оценки */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления оценки */
  @DeleteDateColumn()
  public deleted: Date;

  /** Оценка позиции заказа */
  @Column('smallint')
  public grade: number;

  /** Оценённая позиция заказа */
  @ManyToOne(() => OrderPositionEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'position_id',
  })
  public position: OrderPositionEntity;

  /** Комментарий к оценке */
  @ManyToOne(() => CommentEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'comment_id',
  })
  public comment?: CommentEntity;

  /** Создатель оценки */
  @ManyToOne(() => UserEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity;
}
