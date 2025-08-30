import { Entity, Column, PrimaryGeneratedColumn, BaseEntity, Index, ManyToOne, JoinColumn, Unique } from 'typeorm';

import { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

/** Локализация служб доставки */
@Entity({
  name: 'delivery_credentials_translate',
})
@Unique(['lang', 'deliveryCredentials'])
export class DeliveryCredentialsTranslateEntity extends BaseEntity {
  /** Уникальный `id` перевода */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Имя службы доставки */
  @Column('character varying')
  public name: string;

  /** Служба доставки */
  @Index()
  @ManyToOne(() => DeliveryCredentialsEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'delivery_credentials_id',
  })
  public deliveryCredentials: DeliveryCredentialsEntity;

  /** Язык */
  @Column('enum', {
    enum: UserLangEnum,
    enumName: 'user_lang_enum',
  })
  public lang: UserLangEnum;
}
