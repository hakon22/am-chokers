import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';

export type ItemInterface = OmitBase<ItemEntity>;
export type ItemGroupInterface = ItemInterface['group'];

export interface ItemsAndGroupsInterface {
  items: ItemInterface[];
  itemGroups: ItemGroupInterface[];
}
