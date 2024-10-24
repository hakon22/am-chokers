import { UserEntity } from '@server/db/entities/user.entity';
import { ItemEntity } from '@server/db/entities/item.entity';
import { ItemGroupEntity } from '@server/db/entities/item.group.entity';

export const entities = [
  UserEntity,
  ItemEntity,
  ItemGroupEntity,
];
