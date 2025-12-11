import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, Index, ManyToOne, JoinColumn } from 'typeorm';

import { YandexDirectCampaignEntity } from '@server/db/entities/yandex.direct.campaign.entity';

/** Статистика от Яндекс Директа */
@Entity({
  name: 'yandex_direct_statistics',
})
@Unique('UQ_yandex_direct__date__campaign_id', ['date', 'campaign'])
export class YandexDirectStatisticsEntity extends BaseEntity {
  /** Уникальный `id` записи */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания записи */
  @CreateDateColumn()
  public created: Date;

  /** Дата обновления записи */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления записи */
  @DeleteDateColumn()
  public deleted: Date;

  /** Дата записи */
  @Index('yandex_direct_statistics__date__idx')
  @Column('timestamp with time zone')
  public date: Date;

  /** Количество кликов */
  @Column('int')
  public clicks: number;

  /** Стоимость кликов */
  @Column('float')
  public cost: number;

  /** Уникальный `id` компании */
  @Index('yandex_direct_statistics__campaign_id__idx')
  @ManyToOne(() => YandexDirectCampaignEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'campaign_id',
  })
  public campaign: YandexDirectCampaignEntity;
}
