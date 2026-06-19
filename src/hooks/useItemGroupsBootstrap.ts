import { useEffect, useState } from 'react';
import axios from 'axios';

import { routes } from '@/routes';
import { emptySiteSettings, type SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { ItemGroupInterface } from '@/types/item/Item';
import type { SiteVersion } from '@/types/SiteVersion';

interface ItemGroupsBootstrapStateInterface {
  itemGroups: ItemGroupInterface[];
  siteSettings: SiteSettingsInterface;
  siteVersion?: SiteVersion;
  isLoading: boolean;
}

let cachedBootstrap: ItemGroupsBootstrapStateInterface | null = null;

const buildBootstrapState = (itemGroups: ItemGroupInterface[], siteSettings: SiteSettingsInterface): ItemGroupsBootstrapStateInterface => ({
  itemGroups,
  siteSettings,
  siteVersion: siteSettings.siteVersion,
  isLoading: false,
});

const resolveInitialSiteVersion = (
  initialSiteSettings?: SiteSettingsInterface,
  initialSiteVersion?: SiteVersion,
): SiteVersion | undefined =>
  initialSiteVersion ?? initialSiteSettings?.siteVersion;

/**
 * Подгружает группы товаров и настройки на клиенте для страниц без SSR bootstrap
 * @param initialItemGroups - группы из pageProps (если уже есть)
 * @param initialSiteSettings - настройки из pageProps (если уже есть)
 * @param initialSiteVersion - версия сайта из pageProps (если уже есть)
 * @returns актуальные данные для VersionedShell
 */
export const useItemGroupsBootstrap = (
  initialItemGroups: ItemGroupInterface[],
  initialSiteSettings?: SiteSettingsInterface,
  initialSiteVersion?: SiteVersion,
): ItemGroupsBootstrapStateInterface => {
  const [state, setState] = useState<ItemGroupsBootstrapStateInterface>(() => {
    if (initialItemGroups.length > 0) {
      const siteSettings = initialSiteSettings ?? emptySiteSettings;

      return {
        itemGroups: initialItemGroups,
        siteSettings,
        siteVersion: resolveInitialSiteVersion(siteSettings, initialSiteVersion),
        isLoading: false,
      };
    }

    if (cachedBootstrap) {
      return cachedBootstrap;
    }

    return {
      itemGroups: [],
      siteSettings: emptySiteSettings,
      isLoading: true,
    };
  });

  useEffect(() => {
    if (initialItemGroups.length > 0) {
      const siteSettings = initialSiteSettings ?? emptySiteSettings;
      cachedBootstrap = buildBootstrapState(initialItemGroups, siteSettings);
      return;
    }

    if (cachedBootstrap) {
      return;
    }

    const fetchBootstrap = async () => {
      try {
        const [{ data: { itemGroups } }, { data: settingsData }] = await Promise.all([
          axios.get<{ itemGroups: ItemGroupInterface[]; }>(routes.itemGroup.findMany({ isServer: true })),
          axios.get<{ code: number; siteSettings?: SiteSettingsInterface; }>(routes.settings.getSettings({ isServer: true })),
        ]);

        const siteSettings = settingsData.siteSettings ?? emptySiteSettings;
        const nextState = buildBootstrapState(itemGroups, siteSettings);

        cachedBootstrap = nextState;
        setState(nextState);
      } catch {
        setState((previousState) => ({
          ...previousState,
          isLoading: false,
        }));
      }
    };

    fetchBootstrap();
  }, [initialItemGroups.length, initialSiteSettings]);

  return state;
};
