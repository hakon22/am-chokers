import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ImageEntity } from '@server/db/entities/image.entity';

export type ItemInterface = OmitBase<ItemEntity>;
export type ItemGroupInterface = ItemInterface['group'];
export type ItemCollectionInterface = Required<ItemInterface>['collection'];

export interface GeneralPageBestsellerInterface {
  bestseller1?: ItemInterface;
  bestseller2?: ItemInterface;
  bestseller3?: ItemInterface;
}

export interface GeneralPageCollectionInterface {
  collection1?: ItemInterface;
  collection2?: ItemInterface;
  collection3?: ItemInterface;
  collection4?: ItemInterface;
  collection5?: ItemInterface;
}

export interface GeneralPageCoverImageInterface {
  coverImage1?: ImageEntity;
  coverImage2?: ImageEntity;
  coverImage3?: ImageEntity;
  coverImage4?: ImageEntity;
  coverImage5?: ImageEntity;
  coverImage6?: ImageEntity;
  coverCollectionImage9?: ImageEntity;
  coverCollectionImage10?: ImageEntity;
  coverCollectionImage11?: ImageEntity;
  coverCollectionImage12?: ImageEntity;
  coverCollectionImage13?: ImageEntity;
}

export interface GeneralPageInterface extends GeneralPageBestsellerInterface, GeneralPageCollectionInterface, GeneralPageCoverImageInterface {
  news: ItemInterface[];
}

export interface AppDataInterface {
  itemGroups: ItemGroupInterface[];
  specialItems: ItemInterface[];
  coverImages: ImageEntity[];
}

export interface FetchItemInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  search?: string;
}
