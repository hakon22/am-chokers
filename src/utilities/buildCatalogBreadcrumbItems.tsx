import Link from 'next/link';
import type { TFunction } from 'i18next';
import type { ReactNode } from 'react';

import { routes } from '@/routes';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { ItemInterface } from '@/types/item/Item';
import type { ItemGroupInterface } from '@/types/item/Item';

export type CatalogBreadcrumbAntdItem = {
  title: ReactNode;
};

/**
 * Разбирает путь каталога на сегменты без query
 * @param asPath - router.asPath
 * @returns сегменты пути после домена
 */
export const parseCatalogPathSegments = (asPath: string): string[] => {
  const pathname = asPath.split('?')[0] ?? '';
  return pathname.split('/').filter(Boolean);
};

/**
 * Собирает пункты Ant Design Breadcrumb для страниц каталога (SSR-safe)
 * @param asPath - router.asPath
 * @param itemGroups - группы товаров
 * @param lang - язык интерфейса
 * @param item - товар с SSR (если страница товара)
 * @param catalogItemGroup - группа с SSR страницы категории (если есть)
 * @param t - функция перевода modules.navbar
 * @returns массив пунктов крошек
 */
export const buildCatalogBreadcrumbItems = ({
  asPath,
  itemGroups,
  lang,
  item,
  catalogItemGroup,
  t,
}: {
  asPath: string;
  itemGroups: ItemGroupEntity[];
  lang: UserLangEnum;
  item?: ItemInterface;
  catalogItemGroup?: ItemGroupInterface | null;
  t: TFunction;
}): CatalogBreadcrumbAntdItem[] => {
  const segments = parseCatalogPathSegments(asPath);
  const catalogIndex = segments.indexOf('catalog');

  if (catalogIndex === -1) {
    return [];
  }

  const catalogSegments = segments.slice(catalogIndex);
  const homeLabel = t('menu.home');
  const catalogLabel = t('menu.catalog');
  const crumbs: CatalogBreadcrumbAntdItem[] = [
    {
      title: <Link href={routes.page.base.homePage} title={homeLabel}>{homeLabel}</Link>,
    },
  ];

  if (catalogSegments.length === 1) {
    crumbs.push({ title: catalogLabel });
    return crumbs;
  }

  crumbs.push({
    title: <Link href={routes.page.base.catalog} title={catalogLabel}>{catalogLabel}</Link>,
  });

  const groupCode = catalogSegments[1];
  const itemGroup = itemGroups.find((group) => group.code === groupCode)
    ?? (catalogItemGroup?.code === groupCode ? catalogItemGroup : undefined)
    ?? (item?.group?.code === groupCode ? item.group : undefined);
  const groupName = itemGroup?.translations?.find((translation) => translation.lang === lang)?.name ?? groupCode;

  if (catalogSegments.length === 2) {
    crumbs.push({ title: groupName });
    return crumbs;
  }

  crumbs.push({
    title: (
      <Link href={`${routes.page.base.catalog}/${groupCode}`} title={groupName}>
        {groupName}
      </Link>
    ),
  });

  const itemTranslation = item?.translations.find((translation) => translation.lang === lang);
  const itemName = itemTranslation?.name ?? catalogSegments[2] ?? '';
  crumbs.push({ title: itemName });

  return crumbs;
};
