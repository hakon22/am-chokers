export type CatalogIdQueryValue = string | string[] | number | number[] | undefined;

/**
 * Извлекает из query только валидные целочисленные ID каталога
 * @param value - значение query-параметра (строка, массив или число из Next.js / Express)
 * @returns массив положительных ID или undefined, если валидных значений нет
 */
export const parseCatalogIdQueryValue = (value: CatalogIdQueryValue): number[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  const entries = Array.isArray(value) ? value : [value];
  const parsedIds = entries
    .map((entry) => String(entry).trim())
    .filter((entry) => /^\d+$/.test(entry))
    .map((entry) => parseInt(entry, 10));

  if (parsedIds.length === 0) {
    return undefined;
  }

  return parsedIds;
};
