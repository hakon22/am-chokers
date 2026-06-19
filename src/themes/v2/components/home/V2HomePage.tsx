import { useContext, useMemo } from 'react';

import { MobileContext } from '@/components/Context';
import { HeroSection } from '@/themes/v2/components/home/HeroSection';
import { FeaturesStrip } from '@/themes/v2/components/home/FeaturesStrip';
import { BannerSlider } from '@/themes/v2/components/home/BannerSlider';
import pageStyles from '@/themes/v2/components/home/V2HomePage.module.scss';
import { CategoriesSection } from '@/themes/v2/components/home/CategoriesSection';
import { ProductsSection } from '@/themes/v2/components/home/ProductsSection';
import { CollectionsMosaic } from '@/themes/v2/components/home/CollectionsMosaic';
import { CustomOrderSection } from '@/themes/v2/components/home/CustomOrderSection';
import { SocialSection } from '@/themes/v2/components/home/SocialSection';
import { useAppSelector } from '@/hooks/reduxHooks';
import type { BannerInterface } from '@/types/banner/BannerInterface';
import type { ItemInterface, GeneralPageBestsellerInterface, GeneralPageCoverImageInterface } from '@/types/item/Item';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import type { PublicHomeHeroSettingsInterface } from '@/types/site/PublicHomeHeroSettings';

interface HomePageProps {
  news: ItemInterface[];
  preparedBestsellers: GeneralPageBestsellerInterface;
  preparedCoverImages: GeneralPageCoverImageInterface;
  itemGroups: ItemGroupEntity[];
  itemCollections: ItemCollectionEntity[];
  banners: BannerInterface[];
  homeHero: PublicHomeHeroSettingsInterface;
  automaticSalesHits: boolean;
  salesHits: ItemInterface[];
  salesHitsLimit: number;
}

export const V2HomePage = ({
  news,
  preparedBestsellers,
  preparedCoverImages,
  itemGroups,
  itemCollections,
  banners,
  homeHero,
  automaticSalesHits,
  salesHits,
  salesHitsLimit,
}: HomePageProps) => {
  const { isMobile } = useContext(MobileContext);
  const rawCoverImages = useAppSelector((state) => state.app.coverImages);

  const coverImages = useMemo<GeneralPageCoverImageInterface>(() => {
    if (!rawCoverImages.length) {
      return preparedCoverImages;
    }
    return rawCoverImages.reduce((acc, image) => {
      if (!image.coverOrder || !image.coverType) {
        return acc;
      }
      acc[`${image.coverType}${image.coverOrder}` as keyof GeneralPageCoverImageInterface] = image;
      return acc;
    }, {} as GeneralPageCoverImageInterface);
  }, [rawCoverImages, preparedCoverImages]);

  return (
    <>
      <HeroSection banners={banners} homeHero={homeHero} />
      {isMobile ? (
        <div className={pageStyles.mobileBannersOnly}>
          <BannerSlider banners={banners} />
        </div>
      ) : null}
      <FeaturesStrip />
      <CategoriesSection itemGroups={itemGroups} coverImages={coverImages} />
      <ProductsSection
        news={news}
        bestsellers={preparedBestsellers}
        automaticSalesHits={automaticSalesHits}
        salesHits={salesHits}
        salesHitsLimit={salesHitsLimit}
      />
      <CollectionsMosaic collections={itemCollections} coverImages={coverImages} />
      <CustomOrderSection />
      <SocialSection />
    </>
  );
};
