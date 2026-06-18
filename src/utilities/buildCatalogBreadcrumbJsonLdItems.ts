import { routes } from '@/routes';
import type { ItemGroupInterface } from '@/types/item/Item';

interface BuildCatalogBreadcrumbJsonLdItemsParams {
  homeLabel: string;
  catalogLabel: string;
  catalogTitle: string;
  catalogPathname: string;
  itemGroup?: ItemGroupInterface | null;
}

/**
 * Собирает цепочку пунктов для JSON-LD BreadcrumbList страницы каталога
 * @param params - подписи и путь текущей страницы
 * @returns массив { name, url } для buildBreadcrumbJsonLd
 */
export const buildCatalogBreadcrumbJsonLdItems = ({
  homeLabel,
  catalogLabel,
  catalogTitle,
  catalogPathname,
  itemGroup,
}: BuildCatalogBreadcrumbJsonLdItemsParams): { name: string; url: string; }[] => {
  const items: { name: string; url: string; }[] = [
    { name: homeLabel, url: routes.page.base.homePage },
    { name: catalogLabel, url: routes.page.base.catalog },
  ];

  if (itemGroup) {
    items.push({ name: catalogTitle, url: catalogPathname });
  }

  return items;
};
