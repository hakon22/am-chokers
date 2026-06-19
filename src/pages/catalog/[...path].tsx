import { useContext } from 'react';
import type { GetServerSidePropsContext } from 'next';

import { getCatalogPathServerSideProps } from '@/lib/server/ssr/catalog-server-props';
import { CardItem } from '@/components/CardItem';
import Catalog from '@/pages/catalog';
import { ProductPage } from '@/themes/v2/components/catalog/ProductPage';
import { VersionContext } from '@/components/Context';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationInterface } from '@/types/PaginationInterface';
import type { ShopPagePropsInterface } from '@/lib/server/shop-page-props.interface';

export interface CatalogViewPropsInterface {
  items?: ItemInterface[];
  paginationParams?: PaginationInterface;
  itemGroup?: ItemGroupInterface;
  uuid?: string;
  statistics?: Record<number, number>;
}

export interface PagePropsInterface extends ShopPagePropsInterface, CatalogViewPropsInterface {
  item?: ItemInterface;
}

/**
 * SSR каталога и карточки товара
 * @param context - контекст getServerSideProps Next.js
 * @returns redirect или props страницы
 */
export const getServerSideProps = async (context: GetServerSidePropsContext) =>
  getCatalogPathServerSideProps(context);

const ItemPageResolver = ({ item, paginationParams }: { item: ItemInterface; paginationParams?: PaginationInterface; }) => {
  const { version } = useContext(VersionContext);
  return version === 'v2'
    ? <ProductPage item={item} paginationParams={paginationParams} />
    : <CardItem item={item} paginationParams={paginationParams} />;
};

const Page = ({ item, paginationParams, items = [], itemGroup, uuid = '', statistics = {} }: PagePropsInterface) => (
  item
    ? <ItemPageResolver item={item} paginationParams={paginationParams} />
    : <Catalog items={items} paginationParams={paginationParams} itemGroup={itemGroup} uuid={uuid} statistics={statistics} />
);

export default Page;
