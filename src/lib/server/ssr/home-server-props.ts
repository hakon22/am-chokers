import type { GetServerSidePropsContext } from 'next';

import { ensureServerServicesReady } from '@/lib/server/ensure-server-services-ready';
import { mergeShopPageProps } from '@/lib/server/merge-shop-page-props';
import { loadHomePageData } from '@/lib/server/ssr/home-page-data';

/**
 * Загружает props главной страницы для getServerSideProps (без обращения к БД на этапе next build)
 * @param context - контекст getServerSideProps Next.js
 * @returns props главной с bootstrap и контекстом страницы
 */
export const getHomeServerSideProps = async (context: GetServerSidePropsContext) => {
  await ensureServerServicesReady();

  const homeData = await loadHomePageData();

  return {
    props: await mergeShopPageProps(homeData, context.req),
  };
};
