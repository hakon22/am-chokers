import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ImageEntity } from '@server/db/entities/image.entity';

export type ItemInterface = OmitBase<ItemEntity>;
export type ItemGroupInterface = ItemInterface['group'];
export type ItemCollectionInterface = Required<ItemInterface>['collection'];

export interface AppDataInterface {
  items: ItemInterface[];
  itemGroups: ItemGroupInterface[];
  itemCollections: ItemCollectionInterface[];
  coverImages: ImageEntity[];
}

export interface FetchItemInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  search?: string;
}
