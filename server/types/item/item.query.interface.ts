import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';

export interface ItemQueryInterface extends Partial<PaginationQueryInterface> {
  /** `id` товара */
  id?: number;
  /** "Имя" товара */
  name?: string;
  /** "Транслейтное" имя товара */
  translateName?: string;
  /** С удалёнными */
  withDeleted?: boolean;
  /** `id` группы товара */
  itemGroupId?: number;
  /** `id` коллекции товара */
  itemCollectionId?: number;
  /** Строка поиска */
  search?: string;
  /** Код группы товара */
  groupCode?: string;
  groupIds?: number[],
  collectionIds?: number[],
  compositionIds?: number[],
  from?: number,
  to?: number,
  new?: boolean;
  bestseller?: boolean;
}
