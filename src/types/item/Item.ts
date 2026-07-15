import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/OmitBase';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { CoverTypeEnum } from '@server/utilities/enums/cover.type.enum';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';

export type ItemInterface = OmitBase<ItemEntity> & {
  /** Есть ли у товара отдельное фото для AI-примерки (SSR страницы товара) */
  hasTryOnImage?: boolean;
};
export type ItemGroupInterface = ItemInterface['group'];
export type ItemCollectionInterface = Required<ItemInterface>['collection'];

export interface GeneralPageBestsellerInterface {
  bestseller1?: ItemInterface | null;
  bestseller2?: ItemInterface | null;
  bestseller3?: ItemInterface | null;
}

export interface GeneralPageCollectionInterface {
  collection1?: ItemInterface | null;
  collection2?: ItemInterface | null;
  collection3?: ItemInterface | null;
  collection4?: ItemInterface | null;
  collection5?: ItemInterface | null;
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
  siteSettings: SiteSettingsInterface;
}

export interface FetchItemInterface extends PaginationQueryInterface {
  withDeleted?: boolean;
  search?: string;
  /** Только товары с заполненной датой «нет в наличии» */
  outOfStock?: boolean;
}
