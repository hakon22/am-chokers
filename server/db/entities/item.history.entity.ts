import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

import { ItemEntity } from '@server/db/entities/item.entity';
import { UserEntity } from '@server/db/entities/user.entity';

/** Запись истории изменений товара (одна строка — одно изменение поля) */
@Entity({
  name: 'item_history',
})
@Index('item_history__item_id_created_idx', ['item', 'created'])
export class ItemHistoryEntity extends BaseEntity {
  /** Уникальный `id` записи истории */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Время события */
  @CreateDateColumn()
  public created: Date;

  /** Стабильный ключ поля (совпадает с ключами `entityTranslate.item` на клиенте) */
  @Column('character varying')
  public field: string;

  /** Предыдущее значение */
  @Column('text', {
    nullable: true,
    name: 'old_value',
  })
  public oldValue: string | null;

  /** Новое значение */
  @Column('text', {
    nullable: true,
    name: 'new_value',
  })
  public newValue: string | null;

  /** Товар */
  @Index('item_history__item_id_idx')
  @ManyToOne(() => ItemEntity, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'item_id',
  })
  public item: ItemEntity;

  /** Пользователь, выполнивший действие (`NULL` — система / cron) */
  @Index('item_history__user_id_idx')
  @ManyToOne(() => UserEntity, {
    nullable: true,
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  })
  @JoinColumn({
    name: 'user_id',
  })
  public user: UserEntity | null;
}
