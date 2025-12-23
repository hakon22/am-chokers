import { AfterLoad, BaseEntity, Column, CreateDateColumn, Entity, Index, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { OrderEntity } from '@server/db/entities/order.entity';
import { YandexDeliveryStatusEnum } from '@server/types/delivery/yandex/enums/yandex.delivery.status.enum';
import { CDEKDeliveryStatusEnum } from '@server/types/delivery/cdek/enums/cdek-delivery-status.enum';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { YandexDeliveryReasonStatusEnum } from '@server/types/delivery/yandex/enums/yandex.delivery.reason.status.enum';
import { RussianPostMailTypeEnum } from '@server/types/delivery/russian.post.delivery.interface';

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
  @Index()
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

  /** Адрес доставки заказа (ПВЗ клиента) */
  @Column('character varying')
  public address: string;

  /** Статус доставки (Яндекс) */
  @Column({
    type: 'enum',
    enum: YandexDeliveryStatusEnum,
    nullable: true,
    name: 'yandex_status',
  })
  public yandexStatus: YandexDeliveryStatusEnum;

  /** Статус доставки (СДЭК) */
  @Column({
    type: 'enum',
    enum: CDEKDeliveryStatusEnum,
    nullable: true,
    name: 'cdek_status',
  })
  public cdekStatus: CDEKDeliveryStatusEnum;

  /** Индекс почтового отделения */
  @Column('character varying', {
    nullable: true,
  })
  public index?: string;

  /** Наименование тарифа */
  @Column('character varying', {
    nullable: true,
    name: 'tariff_name',
  })
  public tariffName?: string;

  /** Описание тарифа */
  @Column('character varying', {
    nullable: true,
    name: 'tariff_description',
  })
  public tariffDescription?: string;

  /** Код тарифа */
  @Column('int', {
    nullable: true,
    name: 'tariff_code',
  })
  public tariffCode?: number;

  /** Код страны получателя */
  @Column('character varying', {
    nullable: true,
    name: 'country_code',
  })
  public countryCode?: string;

  /** Выбранный тип доставки (только для Почты России) */
  @Column({
    type: 'enum',
    enum: RussianPostMailTypeEnum,
    nullable: true,
    name: 'mail_type',
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

  /** Заказ */
  @OneToOne(() => OrderEntity, order => order.delivery)
  public item: OrderEntity;

  /** Статус доставки (определяется в момент загрузки сущности через TypeORM). НЕ ЯВЛЯЕТСЯ КОЛОНКОЙ */
  public status: YandexDeliveryStatusEnum | CDEKDeliveryStatusEnum;

  @AfterLoad()
  getStatus() {
    switch (this.type) {
    case DeliveryTypeEnum.YANDEX_DELIVERY:
      this.status = this.yandexStatus;
      break;
    case DeliveryTypeEnum.CDEK:
      this.status = this.cdekStatus;
      break;
    }
  }
}
