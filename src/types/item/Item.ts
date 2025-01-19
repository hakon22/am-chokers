import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export type ItemInterface = OmitBase<ItemEntity>;
export type ItemGroupInterface = ItemInterface['group'];
export type ItemCollectionInterface = Required<ItemInterface>['collection'];

export interface AppDataInterface {
  items: ItemInterface[];
  itemGroups: ItemGroupInterface[];
  itemCollections: ItemCollectionInterface[];
}

export interface FetchItemInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
}
