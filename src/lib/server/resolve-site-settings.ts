import { Container } from 'typescript-ioc';

import { SiteSettingsService } from '@server/services/settings/site-settings.service';
import { RedisService } from '@server/db/redis.service';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { SiteVersion } from '@/types/SiteVersion';

const SITE_VERSION_REDIS_KEY = 'SITE_VERSION';

/**
 * Возвращает актуальную версию сайта из Redis или PostgreSQL
 * @returns v1, v2 или v3
 */
export const resolveSiteVersion = async (): Promise<SiteVersion> => {
  const redisService = Container.get(RedisService);
  const siteSettingsService = Container.get(SiteSettingsService);

  let siteVersion = await redisService.get<SiteVersion>(SITE_VERSION_REDIS_KEY);

  if (!siteVersion) {
    siteVersion = await siteSettingsService.getSiteVersionFromDatabase();
    await redisService.set(SITE_VERSION_REDIS_KEY, siteVersion);
  }

  return siteVersion;
};

/**
 * Загружает публичные настройки сайта для SSR и клиента
 * @returns объект настроек с версией интерфейса
 */
export const resolveSiteSettings = async (): Promise<SiteSettingsInterface> => {
  const siteSettingsService = Container.get(SiteSettingsService);
  const siteVersion = await resolveSiteVersion();

  return siteSettingsService.getSiteSettingsPayload(siteVersion);
};
