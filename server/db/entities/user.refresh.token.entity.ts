import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';

import { UserEntity } from '@server/db/entities/user.entity';

/** Токены доступа пользователей */
@Entity({
  name: 'user_refresh_token',
})
export class UserRefreshTokenEntity extends BaseEntity {
  /** Уникальный `id` токена */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания токена */
  @CreateDateColumn()
  public created: Date;

  /** Токен */
  @Column('character varying', {
    name: 'refresh_token',
  })
  public refreshToken: string;

  /** Пользователь */
  @Index('user_refresh_token__user_idx')
  @ManyToOne(() => UserEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity;
}
