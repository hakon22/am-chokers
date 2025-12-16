import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';

import { DeliveryCredentialsTranslateEntity } from '@server/db/entities/delivery.credentials.translate.entity';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';

/** Доступ к интеграциям служб доставки */
@Entity({
  name: 'delivery_credentials',
})
@Unique(['type', 'isDevelopment'])
export class DeliveryCredentialsEntity extends BaseEntity {
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
  @Column('character varying', {
    nullable: true,
  })
  public password: string;

  /** Тестовая учётная запись */
  @Column('boolean', {
    default: false,
    name: 'is_development',
  })
  public isDevelopment: boolean;

  /** Тип доставки */
  @Column('enum', {
    enum: DeliveryTypeEnum,
    enumName: 'delivery_type_enum',
  })
  public type: DeliveryTypeEnum;

  /** Ссылка на базовый API */
  @Column('character varying')
  public url: string;

  /** Локализации службы доставки */
  @OneToMany(() => DeliveryCredentialsTranslateEntity, translate => translate.deliveryCredentials)
  public translations: DeliveryCredentialsTranslateEntity[];
}
