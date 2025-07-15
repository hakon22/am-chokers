import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';

export interface MessageQueryInterface extends Partial<PaginationQueryInterface> {
  /** Телефон пользователя */
  phone?: string;
  /** Типы сообщений */
  types?: MessageTypeEnum[];
  /** Только неотправленные */
  onlyUnsent?: boolean;
  /** `id` пользователя */
  userId?: number;
}
