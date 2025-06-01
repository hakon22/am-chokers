import type { ItemSortEnum } from '@server/types/item/enums/item.sort.enum';
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
  /** `id` групп */
  groupIds?: number[],
  /** `id` коллекций */
  collectionIds?: number[],
  /** `id` компонетов */
  compositionIds?: number[],
  /** `id` цветов */
  colorIds?: number[],
  /** Цена, от */
  from?: number,
  /** Цена, до */
  to?: number,
  /** Новинки */
  new?: boolean;
  /** Бестселлеры */
  bestseller?: boolean;
  /** Сортировка */
  sort?: ItemSortEnum;
}
