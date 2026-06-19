import type { GetServerSidePropsContext } from 'next';

import { ensureServerServicesReady } from '@/lib/server/ensure-server-services-ready';
import { mergeShopPageProps } from '@/lib/server/merge-shop-page-props';

/**
 * getServerSideProps для shop-страниц с bootstrap и контекстом страницы
 * @param context - контекст getServerSideProps Next.js
 * @param pageProps - специфичные для страницы props
 * @returns props с itemGroups, siteSettings, siteVersion, isMobile и initialLanguage
 */
export const getShopPageServerSideProps = async (context: GetServerSidePropsContext, pageProps: Record<string, unknown> = {}) => {
  await ensureServerServicesReady();

  return {
    props: await mergeShopPageProps(pageProps, context.req),
  };
};
