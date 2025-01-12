import { UserEntity } from '@server/db/entities/user.entity';
import { ItemEntity } from '@server/db/entities/item.entity';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import { OrderEntity } from '@server/db/entities/order.entity';
import { OrderPositionEntity } from '@server/db/entities/order.position.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { CartEntity } from '@server/db/entities/cart.entity';
import { CommentEntity } from '@server/db/entities/comment.entity';
import { GradeEntity } from '@server/db/entities/grade.entity';
import { RatingEntity } from '@server/db/entities/rating.entity';
import { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { MessageEntity } from '@server/db/entities/message.entity';
import { PromotionalEntity } from '@server/db/entities/promotional.entity';

export const entities = [
  UserEntity,
  ItemEntity,
  ItemGroupEntity,
  OrderEntity,
  OrderPositionEntity,
  ImageEntity,
  ItemCollectionEntity,
  CartEntity,
  GradeEntity,
  CommentEntity,
  RatingEntity,
  ItemGradeEntity,
  MessageEntity,
  PromotionalEntity,
];
