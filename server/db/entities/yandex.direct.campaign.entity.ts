import { Entity, BaseEntity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Unique, Index } from 'typeorm';

/** Кампании Яндекс Директа */
@Entity({
  name: 'yandex_direct_campaign',
})
@Unique('yandex_direct_campaign__pk', ['id', 'yandexCampaignId'])
export class YandexDirectCampaignEntity extends BaseEntity {
  /** Уникальный `id` кампании */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания кампании */
  @CreateDateColumn()
  public created: Date;

  /** Дата обновления кампании */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления кампании */
  @DeleteDateColumn()
  public deleted: Date;

  /** Имя кампании */
  @Column('character varying')
  public name: string;

  /** Тип кампании */
  @Column('character varying')
  public type: string;

  /** Уникальный `id` кампании в Яндекс Директе */
  @Index('UQ_yandex_direct_campaign__yandex_campaign_id')
  @Column('character varying', {
    name: 'yandex_campaign_id',
    unique: true,
  })
  public yandexCampaignId: string;
}
