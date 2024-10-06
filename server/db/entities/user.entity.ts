import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/** Пользователь */
@Entity({
  name: 'user',
})
export class UserEntity {
  /** Уникальный id пользователя */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя пользователя */
  @Column('character varying')
  public name: string;

  /** Пароль пользователя */
  @Column('character varying')
  public password: string;

  /** Телефон пользователя */
  @Column('character varying')
  public phone: string;

  /** Refresh токен пользователя */
  @Column('character varying', {
    array: true,
    name: 'refresh_token',
  })
  public refreshToken: string[];

  /** Номер Telegram пользователя */
  @Column('character varying', {
    name: 'telegram_id',
  })
  public telegramId: string;

  /** Роль пользователя */
  @Column('enum', {
    enum: UserRoleEnum,
  })
  public role: UserRoleEnum;
}
