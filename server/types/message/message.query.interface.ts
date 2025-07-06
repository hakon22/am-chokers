import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';

export interface MessageQueryInterface extends Partial<PaginationQueryInterface> {
  phone?: string;
  types?: MessageTypeEnum[];
  onlySent?: boolean;
}
