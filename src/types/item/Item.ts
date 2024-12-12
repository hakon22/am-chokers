import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';

export type ItemInterface = OmitBase<ItemEntity>;
export type ItemGroupInterface = ItemInterface['group'];
export type ItemCollectionInterface = ItemInterface['collection'];

export interface AppDataInterface {
  items: ItemInterface[];
  itemGroups: ItemGroupInterface[];
  itemCollections: ItemCollectionInterface[];
}
