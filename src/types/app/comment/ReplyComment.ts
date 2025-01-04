import type { CommentEntity } from '@server/db/entities/comment.entity';
import type { ImageEntity } from '@server/db/entities/image.entity';

export interface ReplyComment {
  parentComment: Pick<CommentEntity, 'id'>;
  text: string;
  images?: Pick<ImageEntity, 'id'>[];
}
