import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

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

  /** Значение настройки */
  @Column('character varying')
  public value: string;

  @CreateDateColumn()
  public created: Date;

  @UpdateDateColumn()
  public updated: Date;
}
