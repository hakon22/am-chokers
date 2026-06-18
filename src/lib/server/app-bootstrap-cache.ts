import type { ItemGroupInterface } from '@/types/item/Item';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';

const APP_BOOTSTRAP_CACHE_TTL_MS = 60_000;

interface CacheEntryInterface<T> {
  value: T;
  expiresAt: number;
}

let itemGroupsCacheEntry: CacheEntryInterface<ItemGroupInterface[]> | null = null;
let siteSettingsCacheEntry: CacheEntryInterface<SiteSettingsInterface> | null = null;

/**
 * Возвращает значение из in-memory кэша, если запись ещё не истекла
 * @param cacheEntry - текущая запись кэша
 * @returns закэшированное значение или null
 */
const readCacheEntry = <T>(cacheEntry: CacheEntryInterface<T> | null): T | null => {
  if (cacheEntry === null) {
    return null;
  }

  if (Date.now() >= cacheEntry.expiresAt) {
    return null;
  }

  return cacheEntry.value;
};

/**
 * Загружает группы товаров с коротким in-memory кэшем для SSR bootstrap
 * @param fetchItemGroups - функция загрузки при промахе кэша
 * @returns список групп товаров
 */
export const getCachedItemGroups = async (fetchItemGroups: () => Promise<ItemGroupInterface[]>): Promise<ItemGroupInterface[]> => {
  const cachedItemGroups = readCacheEntry(itemGroupsCacheEntry);
  if (cachedItemGroups !== null) {
    return cachedItemGroups;
  }

  const itemGroups = await fetchItemGroups();
  itemGroupsCacheEntry = {
    value: itemGroups,
    expiresAt: Date.now() + APP_BOOTSTRAP_CACHE_TTL_MS,
  };

  return itemGroups;
};

/**
 * Загружает настройки сайта с коротким in-memory кэшем для SSR bootstrap
 * @param fetchSiteSettings - функция загрузки при промахе кэша
 * @returns настройки сайта
 */
export const getCachedSiteSettings = async (fetchSiteSettings: () => Promise<SiteSettingsInterface>): Promise<SiteSettingsInterface> => {
  const cachedSiteSettings = readCacheEntry(siteSettingsCacheEntry);
  if (cachedSiteSettings !== null) {
    return cachedSiteSettings;
  }

  const siteSettings = await fetchSiteSettings();
  siteSettingsCacheEntry = {
    value: siteSettings,
    expiresAt: Date.now() + APP_BOOTSTRAP_CACHE_TTL_MS,
  };

  return siteSettings;
};
