import type { GetServerSidePropsContext } from 'next';

import { ensureServerServicesReady } from '@/lib/server/ensure-server-services-ready';
import { loadPageContext } from '@/lib/server/load-page-context';
import { mergeShopPageProps } from '@/lib/server/merge-shop-page-props';
import { loadCatalogLinks, loadCatalogListPageData, loadProductPageData } from '@/lib/server/ssr/catalog-page-data';
import { routes } from '@/routes';
import type { CatalogIdQueryValue } from '@shared/parse-catalog-id-query-value';

interface CatalogRouteParamsInterface {
  path?: string[];
}

interface CatalogRouteQueryInterface {
  groupIds?: CatalogIdQueryValue;
  collectionIds?: CatalogIdQueryValue;
  compositionIds?: CatalogIdQueryValue;
  colorIds?: CatalogIdQueryValue;
  from?: number;
  to?: number;
  search?: string;
  new?: boolean;
  bestseller?: boolean;
  inStock?: boolean;
  sort?: string;
  page?: number | string | string[];
}

/**
 * Загружает props листинга каталога для корневого маршрута /catalog
 * @param context - контекст getServerSideProps Next.js
 * @returns props с bootstrap и данными каталога
 */
export const getCatalogIndexServerSideProps = async (context: GetServerSidePropsContext) => {
  await ensureServerServicesReady();

  try {
    const { initialLanguage } = loadPageContext(context.req);
    const catalogData = await loadCatalogListPageData(
      {
        params: { path: [] },
        query: context.query as CatalogRouteQueryInterface,
      },
      initialLanguage,
    );

    return mergeShopPageProps(catalogData, context.req);
  } catch {
    return {
      redirect: {
        permanent: false,
        destination: routes.page.base.homePage,
      },
    };
  }
};

/**
 * Загружает props для динамических маршрутов каталога и карточки товара
 * @param context - контекст getServerSideProps Next.js
 * @returns redirect или props страницы
 */
export const getCatalogPathServerSideProps = async (context: GetServerSidePropsContext) => {
  await ensureServerServicesReady();

  const { params, query, req } = context;

  try {
    const typedParams = params as CatalogRouteParamsInterface;
    const typedQuery = query as CatalogRouteQueryInterface | undefined;
    const { initialLanguage } = loadPageContext(req);
    const links = await loadCatalogLinks();

    const path = typedParams.path ?? [];
    const [, itemName] = path;

    if (path.length > 2 || path.find((link) => !links.includes(link))) {
      return {
        redirect: {
          permanent: false,
          destination: routes.page.base.homePage,
        },
      };
    }

    if (itemName) {
      const productData = await loadProductPageData(itemName, initialLanguage, req.headers.cookie);

      if (productData) {
        return {
          props: await mergeShopPageProps(productData, req),
        };
      }
    }

    const catalogData = await loadCatalogListPageData(
      { params: typedParams, query: typedQuery },
      initialLanguage,
    );

    return {
      props: await mergeShopPageProps(catalogData, req),
    };
  } catch {
    return {
      redirect: {
        permanent: false,
        destination: routes.page.base.homePage,
      },
    };
  }
};
