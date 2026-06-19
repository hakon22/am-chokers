import { Container } from 'typescript-ioc';

import { ItemGroupService } from '@server/services/item/item.group.service';
import { resolveSiteSettings } from '@/lib/server/resolve-site-settings';
import type { ItemGroupInterface } from '@/types/item/Item';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { SiteVersion } from '@/types/SiteVersion';

export interface AppBootstrapInterface {
  itemGroups: ItemGroupInterface[];
  siteSettings: SiteSettingsInterface;
  siteVersion: SiteVersion;
}

/**
 * Загружает данные bootstrap приложения прямыми вызовами сервисов (без HTTP loopback)
 * @returns группы товаров, настройки сайта и версию интерфейса
 */
export const loadAppBootstrap = async (): Promise<AppBootstrapInterface> => {
  const itemGroupService = Container.get(ItemGroupService);
  const [itemGroups, siteSettings] = await Promise.all([
    itemGroupService.findMany(),
    resolveSiteSettings(),
  ]);

  return {
    itemGroups,
    siteSettings,
    siteVersion: siteSettings.siteVersion,
  };
};
