import {
  Entity, Column, PrimaryGeneratedColumn, BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { InputMediaPhoto } from 'telegraf/typings/core/types/typegram';

import { MessageTypeEnum } from '@server/types/integration/enums/message.type.enum';

/** Сообщения */
@Entity({
  name: 'message',
})
export class MessageEntity extends BaseEntity {
  /** Уникальный `id` сообщения */
  @PrimaryGeneratedColumn()
  public id: number;

  /** Дата создания сообщения */
  @CreateDateColumn()
  public created: Date;

  /** Дата изменения сообщения */
  @UpdateDateColumn()
  public updated: Date;

  /** Дата удаления сообщения */
  @DeleteDateColumn()
  public deleted: Date;

  /** Текст сообщения */
  @Column('text')
  public text: string;

  /** Тип сообщения */
  @Column('enum', {
    enum: MessageTypeEnum,
  })
  public type: MessageTypeEnum;

  /** Статус отправки сообщения */
  @Column('boolean', {
    default: false,
  })
  public send: boolean;

  /** Телефон адресата сообщения */
  @Column('character varying', {
    nullable: true,
  })
  public phone?: string;

  /** Уникальный id пользователя в Telegram */
  @Column('character varying', {
    name: 'telegram_id',
    nullable: true,
  })
  public telegramId?: string;

  /** Уникальный id сообщения в Telegram */
  @Column('character varying', {
    name: 'message_id',
    nullable: true,
  })
  public messageId?: string;

  /** Медиа, прикреплённые к сообщению в Telegram */
  @Column('character varying', {
    name: 'media_files',
    array: true,
    default: [],
  })
  public mediaFiles: InputMediaPhoto[];
}
