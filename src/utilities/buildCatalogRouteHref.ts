import { isNil } from 'lodash';
import type { NextRouter } from 'next/router';

type CatalogRouteQueryValue = string | string[] | undefined | null;

/**
 * Собирает относительный href каталога из asPath и query (корректно для /catalog/[...path])
 * @param router - экземпляр Next.js router
 * @param queryOverrides - параметры, которые нужно добавить или заменить
 * @param options - номер страницы и ключи для исключения из query
 * @returns путь с query, например /catalog/chokers?page=2
 */
export const buildCatalogRouteHref = (
  router: NextRouter,
  queryOverrides: Record<string, CatalogRouteQueryValue> = {},
  options?: { pageNumber?: number; excludeKeys?: string[]; },
): string => {
  const excludeKeys = new Set(['page', 'path', ...(options?.excludeKeys ?? [])]);
  const mergedQuery: Record<string, string | string[]> = {};

  Object.entries(router.query).forEach(([key, value]) => {
    if (excludeKeys.has(key) || value === undefined) {
      return;
    }

    mergedQuery[key] = value;
  });

  Object.entries(queryOverrides).forEach(([key, value]) => {
    if (isNil(value) || value === '') {
      delete mergedQuery[key];
      return;
    }

    mergedQuery[key] = value;
  });

  const searchParams = new URLSearchParams();

  Object.entries(mergedQuery).forEach(([key, value]) => {
    if (excludeKeys.has(key)) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => searchParams.append(key, entry));
      return;
    }

    searchParams.set(key, value);
  });

  if (options?.pageNumber && options.pageNumber > 1) {
    searchParams.set('page', String(options.pageNumber));
  }

  const pathWithoutQuery = router.asPath.split('?')[0] ?? router.asPath;
  const queryString = searchParams.toString();

  return `${pathWithoutQuery}${queryString ? `?${queryString}` : ''}`;
};

/**
 * Собирает абсолютный URL страницы каталога для rel prev/next
 * @param router - экземпляр Next.js router
 * @param productionHost - базовый URL сайта
 * @param pageNumber - номер страницы пагинации
 * @returns абсолютный URL
 */
export const buildCatalogPageAbsoluteUrl = (
  router: NextRouter,
  productionHost: string,
  pageNumber: number,
): string => `${productionHost}${buildCatalogRouteHref(router, {}, { pageNumber })}`;
