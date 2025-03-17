import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { AcquiringTypeEnum } from '@server/types/acquiring/enums/acquiring.type.enum';

/** Доступ к эквайрингу */
@Entity({
  name: 'acquiring_credentials',
})
@Unique(['issuer', 'isDevelopment'])
export class AcquiringCredentialsEntity extends BaseEntity {
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
  @Column('character varying')
  public login: string;

  /** Пароль доступа */
  @Column('character varying')
  public password: string;

  /** Тестовая учётная запись */
  @Column('boolean', {
    default: false,
    name: 'is_development',
  })
  public isDevelopment: boolean;

  /** Эмитент */
  @Column({
    type: 'enum',
    enum: AcquiringTypeEnum,
  })
  public issuer: AcquiringTypeEnum;
}
