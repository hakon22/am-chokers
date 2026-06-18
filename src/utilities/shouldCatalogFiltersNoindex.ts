import type { NextRouter } from 'next/router';

const catalogRouteQueryKeys = new Set(['page', 'path']);

/**
 * Проверяет, является ли query.page числовой пагинацией каталога
 * @param pageValue - значение router.query.page
 * @returns true, если page — номер страницы для SEO-пагинации
 */
export const isCatalogNumericPageQuery = (pageValue: string | string[] | undefined): boolean => {
  const pageString = pageValue === undefined
    ? ''
    : Array.isArray(pageValue)
      ? pageValue[0] ?? ''
      : pageValue;

  return /^\d+$/.test(pageString);
};

/**
 * Определяет, нужен ли noindex для каталога с активными фильтрами в query
 * @param query - router.query страницы каталога
 * @returns true, если URL с фильтрами не должен индексироваться
 */
export const shouldCatalogFiltersNoindex = (
  query: NextRouter['query'],
): boolean => Object.entries(query).some(([key, value]) => {
  if (catalogRouteQueryKeys.has(key) || value === undefined) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return String(value).length > 0;
});
