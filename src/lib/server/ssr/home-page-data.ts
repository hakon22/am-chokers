import { Container } from 'typescript-ioc';

import { BannerService } from '@server/services/banner/banner.service';
import { ImageService } from '@server/services/storage/image.service';
import { ItemCollectionService } from '@server/services/item/item.collection.service';
import { ItemService } from '@server/services/item/item.service';
import { LoggerService } from '@server/services/app/logger.service';
import { resolveSiteSettings } from '@/lib/server/resolve-site-settings';
import type { ItemInterface, GeneralPageBestsellerInterface, GeneralPageCollectionInterface, GeneralPageCoverImageInterface } from '@/types/item/Item';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { BannerInterface } from '@/types/banner/BannerInterface';
import type { SiteSettingsInterface } from '@/types/site/SiteSettings';
import type { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import type { PublicHomeHeroSettingsInterface } from '@/types/site/PublicHomeHeroSettings';

const buildCoverImagesMap = (images: ImageEntity[]): GeneralPageCoverImageInterface =>
  images.reduce((acc, image) => {
    if (!image.coverOrder || !image.coverType) {
      return acc;
    }
    acc[`${image.coverType}${image.coverOrder}` as keyof GeneralPageCoverImageInterface] = image;
    return acc;
  }, {} as GeneralPageCoverImageInterface);

export interface HomePageDataInterface {
  news: ItemInterface[];
  preparedBestsellers: GeneralPageBestsellerInterface;
  preparedCollections: GeneralPageCollectionInterface;
  preparedCoverImages: GeneralPageCoverImageInterface;
  itemCollections: ItemCollectionEntity[];
  specialItems: ItemInterface[];
  coverImages: ImageEntity[];
  banners: BannerInterface[];
  homeHero: PublicHomeHeroSettingsInterface;
  automaticSalesHits: boolean;
  salesHits: ItemInterface[];
  salesHitsLimit: number;
  siteSettings: SiteSettingsInterface;
}

/**
 * Загружает данные главной страницы прямыми вызовами сервисов
 * @returns агрегированные props для index.tsx
 */
export const loadHomePageData = async (): Promise<HomePageDataInterface> => {
  const loggerService = Container.get(LoggerService);
  const startedAt = Date.now();

  const itemService = Container.get(ItemService);
  const bannerService = Container.get(BannerService);
  const itemCollectionService = Container.get(ItemCollectionService);
  const imageService = Container.get(ImageService);

  const salesHitsLimit = 4;

  const siteSettings = await resolveSiteSettings();

  const [specialItems, banners, itemCollections] = await Promise.all([
    itemService.getSpecials(false),
    bannerService.findMany(),
    itemCollectionService.findMany(),
  ]);

  const automaticSalesHits = siteSettings.automaticSalesHits ?? false;

  let salesHits: ItemInterface[] = [];

  if (automaticSalesHits) {
    salesHits = await itemService.getTopSalesHits(salesHitsLimit);
  }

  const versionNumber = parseInt(siteSettings.siteVersion.slice(1), 10);
  const coverImages = await imageService.findCoverImagesBySiteVersion(versionNumber);

  const { bestsellers, collections, news } = specialItems.reduce((acc, item) => {
    if (item.new) {
      acc.news.push(item);
    }
    if (item.bestseller) {
      acc.bestsellers.push(item);
    }
    if (item.collection) {
      acc.collections.push(item);
    }
    return acc;
  }, { bestsellers: [], collections: [], news: [] } as { bestsellers: ItemInterface[]; collections: ItemInterface[]; news: ItemInterface[]; });

  const preparedBestsellers = automaticSalesHits
    ? { bestseller1: null, bestseller2: null, bestseller3: null } as GeneralPageBestsellerInterface
    : bestsellers.reduce((acc, item) => {
      if (!item.deleted) {
        switch (item.order) {
        case 1:
          acc.bestseller1 = item;
          break;
        case 2:
          acc.bestseller2 = item;
          break;
        case 3:
          acc.bestseller3 = item;
          break;
        }
      }
      return acc;
    }, { bestseller1: null, bestseller2: null, bestseller3: null } as GeneralPageBestsellerInterface);

  const preparedCollections = collections.reduce((acc, item) => {
    if (!item.deleted) {
      switch (item.order) {
      case 4:
        acc.collection1 = item;
        break;
      case 5:
        acc.collection2 = item;
        break;
      case 6:
        acc.collection3 = item;
        break;
      case 7:
        acc.collection4 = item;
        break;
      case 8:
        acc.collection5 = item;
        break;
      }
    }
    return acc;
  }, { collection1: null, collection2: null, collection3: null, collection4: null, collection5: null } as GeneralPageCollectionInterface);

  const preparedCoverImages = buildCoverImagesMap(coverImages);

  loggerService.info('SSR', `loadHomePageData completed in ${Date.now() - startedAt}ms`);

  return {
    news,
    preparedBestsellers,
    preparedCollections,
    preparedCoverImages,
    itemCollections,
    specialItems,
    coverImages,
    banners,
    homeHero: siteSettings.homeHero,
    automaticSalesHits,
    salesHits,
    salesHitsLimit,
    siteSettings,
  };
};
