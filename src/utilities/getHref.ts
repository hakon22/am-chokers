import { routes } from '@/routes';
import { ItemInterface } from '@/types/item/Item';

/**
 * Собирает href раздела каталога по коду группы
 * @param groupCode - код группы товаров
 * @returns путь в каталог
 */
export const buildCatalogGroupHref = (groupCode: string): string =>
  `${routes.page.base.catalog}/${groupCode}`;

/**
 * Собирает href карточки товара в каталоге
 * @param groupCode - код группы товаров
 * @param translateName - slug товара
 * @returns путь в каталог
 */
export const buildCatalogItemHref = (groupCode: string, translateName: string): string =>
  `${routes.page.base.catalog}/${groupCode}/${translateName}`;

/**
 * Возвращает href карточки товара, если заполнены код группы и slug
 * @param itemGroupCode - код группы товаров
 * @param itemTranslateName - slug товара
 * @returns путь в каталог или undefined
 */
export const buildCatalogItemHrefIfValid = (
  itemGroupCode: string,
  itemTranslateName: string,
): string | undefined => {
  if (!itemGroupCode || !itemTranslateName) {
    return undefined;
  }
  return buildCatalogItemHref(itemGroupCode, itemTranslateName);
};

/**
 * Возвращает href раздела каталога, если указан код группы
 * @param groupCode - код группы товаров
 * @returns путь в каталог или undefined
 */
export const buildCatalogGroupHrefIfValid = (groupCode: string): string | undefined => {
  if (!groupCode) {
    return undefined;
  }
  return buildCatalogGroupHref(groupCode);
};

/**
 * Собирает href товара в каталоге из полной сущности
 * @param item - товар с группой
 * @returns путь в каталог
 */
export const getHref = (item?: ItemInterface | null) => (
  item?.group
    ? buildCatalogItemHref(item.group.code, item.translateName)
    : routes.page.base.catalog
);
