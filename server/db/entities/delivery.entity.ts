import { BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { YandexDeliveryStatusEnum } from '@server/types/delivery/enums/yandex/yandex.delivery.status.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { YandexDeliveryReasonStatusEnum } from '@server/types/delivery/enums/yandex/yandex.delivery.reason.status.enum';
import { RussianPostMailTypeEnum } from '@/types/delivery/russian.post.delivery.interface';

/** Доставка */
@Entity({
  name: 'delivery',
})
export class DeliveryEntity extends BaseEntity {
  /** Уникальный `id` доставки (внутренний) */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания доставки */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения доставки */
  @UpdateDateColumn()
  public updated: Date;

  /** Уникальный `id` доставки (внешний) */
  @Column('character varying', {
    name: 'delivery_id',
    nullable: true,
  })
  public deliveryId: string;

  /** Уникальная ссылка на отслеживание заказа */
  @Column('character varying', {
    nullable: true,
  })
  public url: string;

  /** Уникальный номер станции отправки заказа (склад) */
  @Column('character varying', {
    name: 'platform_station_from',
    nullable: true,
  })
  public platformStationFrom: string;

  /** Уникальный номер станции доставки заказа (ПВЗ клиента) */
  @Column('character varying', {
    name: 'platform_station_to',
    nullable: true,
  })
  public platformStationTo: string;

  /** Предварительная дата доставки, начало */
  @Column('timestamp with time zone', {
    name: 'delivery_from',
    nullable: true,
  })
  public deliveryFrom: Date;

  /** Предварительная дата доставки, конец */
  @Column('timestamp with time zone', {
    name: 'delivery_to',
    nullable: true,
  })
  public deliveryTo: Date;

  /** Текстовый доставки заказа (ПВЗ клиента) */
  @Column('character varying')
  public address: string;

  /** Статус доставки */
  @Column({
    type: 'enum',
    enum: YandexDeliveryStatusEnum,
    nullable: true,
  })
  public status: YandexDeliveryStatusEnum;

  /** Индекс почтового отделения (только для Почты России) */
  @Column('character varying', {
    nullable: true,
  })
  public index?: string;

  /** Выбранный тип доставки (только для Почты России) */
  @Column({
    type: 'enum',
    enum: RussianPostMailTypeEnum,
    nullable: true,
  })
  public mailType?: RussianPostMailTypeEnum;

  /** Тип доставки */
  @Column('enum', {
    enum: DeliveryTypeEnum,
  })
  public type: DeliveryTypeEnum;

  /** Причина отказа или задержки */
  @Column('enum', {
    enum: YandexDeliveryReasonStatusEnum,
    nullable: true,
  })
  public reason?: YandexDeliveryReasonStatusEnum;
}
