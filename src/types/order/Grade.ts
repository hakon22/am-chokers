import type { CommentEntity } from '@server/db/entities/comment.entity';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';

export interface GradeFormInterface {
  grade: number;
  position: Pick<OrderPositionInterface, 'id'>;
  comment?: Pick<CommentEntity, 'text' | 'images'>;
}
