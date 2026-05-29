import type { SiteVersion } from '@/types/SiteVersion';
import type { PublicHomeHeroSettingsInterface } from '@/types/site/PublicHomeHeroSettings';
import type { PublicPickupSettingsInterface } from '@/types/site/PublicPickupSettings';

export interface SiteSettingsInterface {
  siteVersion: SiteVersion;
  pickup: PublicPickupSettingsInterface;
  homeHero: PublicHomeHeroSettingsInterface;
}

export const emptySiteSettings: SiteSettingsInterface = {
  siteVersion: 'v1',
  pickup: {
    locationLabel: '',
    blockedDateRanges: [],
  },
  homeHero: {
    eyebrowTitle: '',
    eyebrowSubtitle: '',
  },
};
