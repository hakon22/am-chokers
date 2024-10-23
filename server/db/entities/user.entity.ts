import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BaseEntity,
} from 'typeorm';

/** Пользователь */
@Entity({
  name: 'user',
})
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

  /** Пароль пользователя */
  @Column('character varying')
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
