import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { CoverTypeEnum } from '@server/utilities/enums/cover.type.enum';

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

export type GeneralPageCoverImageInterface = {
  [K in `${CoverTypeEnum}${number}`]?: ImageEntity;
};

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
  /** Только товары с заполненной датой «нет в наличии» */
  outOfStock?: boolean;
}
