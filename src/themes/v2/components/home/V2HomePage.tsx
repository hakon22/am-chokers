import { useMemo } from 'react';
import type { InferGetServerSidePropsType } from 'next';

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
import type { getServerSideProps } from '@/pages/index';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';
import type { GeneralPageCoverImageInterface } from '@/types/item/Item';

type HomePageProps = InferGetServerSidePropsType<typeof getServerSideProps> & {
  itemGroups: ItemGroupEntity[];
  itemCollections: ItemCollectionEntity[];
};

export const V2HomePage = ({ news, preparedBestsellers, preparedCoverImages, itemGroups, itemCollections, banners }: HomePageProps) => {
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
      <HeroSection banners={banners} />
      <div className={pageStyles.mobileBannersOnly}>
        <BannerSlider banners={banners} />
      </div>
      <FeaturesStrip />
      <CategoriesSection itemGroups={itemGroups} coverImages={coverImages} />
      <ProductsSection news={news} bestsellers={preparedBestsellers} />
      <CollectionsMosaic collections={itemCollections} coverImages={coverImages} />
      <CustomOrderSection />
      <SocialSection />
    </>
  );
};
