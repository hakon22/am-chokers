import type { InferGetServerSidePropsType } from 'next';

import { HeroSection } from '@/themes/v2/components/home/HeroSection';
import { FeaturesStrip } from '@/themes/v2/components/home/FeaturesStrip';
import { CategoriesSection } from '@/themes/v2/components/home/CategoriesSection';
import { ProductsSection } from '@/themes/v2/components/home/ProductsSection';
import { CollectionsMosaic } from '@/themes/v2/components/home/CollectionsMosaic';
import { CustomOrderSection } from '@/themes/v2/components/home/CustomOrderSection';
import { SocialSection } from '@/themes/v2/components/home/SocialSection';
import type { getServerSideProps } from '@/pages/index';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';

type HomePageProps = InferGetServerSidePropsType<typeof getServerSideProps> & {
  itemGroups: ItemGroupEntity[];
};

export const V2HomePage = ({ news, preparedBestsellers, preparedCollections, preparedCoverImages, itemGroups }: HomePageProps) => (
  <>
    <HeroSection coverImages={preparedCoverImages} />
    <FeaturesStrip />
    <CategoriesSection itemGroups={itemGroups} />
    <ProductsSection news={news} bestsellers={preparedBestsellers} />
    <CollectionsMosaic collections={preparedCollections} />
    <CustomOrderSection />
    <SocialSection />
  </>
);
