import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BaseEntity,
  Unique,
  DeleteDateColumn,
} from 'typeorm';

import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';

/** Пользователь */
@Entity({
  name: 'user',
})
@Unique(['phone'])
export class UserEntity extends BaseEntity {
  /** Уникальный id пользователя */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя пользователя */
  @Column('character varying')
  public name: string;

  /** Дата создания пользователя */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения пользователя */
  @UpdateDateColumn()
  public updated: Date;

  /** Удалён */
  @DeleteDateColumn()
  public deleted: Date;

  /** Пароль пользователя */
  @Column('character varying', {
    select: false,
  })
  public password: string;

  /** Телефон пользователя */
  @Column('character varying', {
    unique: true,
  })
  public phone: string;

  /** Refresh токены пользователя */
  @Column('character varying', {
    array: true,
    name: 'refresh_token',
    default: [],
  })
  public refreshTokens: string[];

  /** Уникальный id пользователя в Telegram */
  @Column('character varying', {
    name: 'telegram_id',
    nullable: true,
  })
  public telegramId: string;

  /** Роль пользователя */
  @Column('enum', {
    enum: UserRoleEnum,
    default: UserRoleEnum.MEMBER,
  })
  public role: UserRoleEnum;
}
