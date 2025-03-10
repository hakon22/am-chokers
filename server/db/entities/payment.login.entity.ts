import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';

/** Доступ к эквайрингу */
@Entity({
  name: 'payment_login',
})
export class PaymentLoginEntity extends BaseEntity {
  /** Уникальный `id` доступа */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания доступа */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения доступа */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления доступа */
  @DeleteDateColumn()
  public deleted: Date;

  /** Логин доступа */
  @Column('character varying', {
    nullable: false,
  })
  public login: string;

  /** Пароль доступа */
  @Column('character varying', {
    nullable: false,
  })
  public password: string;

  /** Эмитент */
  @Column({
    type: 'enum',
    enum: AcquiringTypeEnum,
    nullable: false,
  })
  public issuer: AcquiringTypeEnum;
}
