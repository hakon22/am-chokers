import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

import type { SiteSettingsJsonValue } from '@server/types/site/site.settings.json.value.type';

/** Настройки сайта */
@Entity({
  name: 'site_settings',
})
@Unique(['key'])
export class SiteSettingsEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  /** Ключ настройки */
  @Column('character varying')
  public key: string;

  /** Значение настройки (JSONB: строка для siteVersion / pickupLocationLabel, массив для периодов самовывоза) */
  @Column('jsonb')
  public value: SiteSettingsJsonValue;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public updated: Date;
}
