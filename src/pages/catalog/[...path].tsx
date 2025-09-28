import axios from 'axios';

import { CardItem } from '@/components/CardItem';
import Catalog from '@/pages/catalog';
import { routes } from '@/routes';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface, PaginationInterface } from '@/types/PaginationInterface';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { ItemGroupResponseInterface, ItemResponseInterface } from '@/slices/appSlice';

interface GetServerSidePropsInterface {
  params: {
    path: string[];
  },
  query?: {
    groupIds?: number | number[];
    collectionIds?: number | number[];
    compositionIds?: number | number[];
    colorIds?: number | number[];
    from?: number;
    to?: number;
    search?: string;
    new?: boolean;
    bestseller?: boolean;
    sort?: string;
    page: number;
  },
}

interface PagePropsInterface {
  item?: ItemInterface;
  items: ItemInterface[];
  paginationParams: PaginationInterface;
  itemGroup?: ItemGroupInterface;
}

export const getCatalogServerSideProps = async ({ params, query }: GetServerSidePropsInterface) => {
  const { path } = params ?? { path: [undefined] };

  const [groupCode] = path;

  const [{ data: { items: payloadItems, paginationParams } }, { data: { itemGroup } }] = await Promise.all([
    axios.get<PaginationEntityInterface<ItemInterface>>(routes.item.getList({ isServer: false }), {
      params: {
        limit: +(query?.page || 1) * 8,
        offset: 0,
        groupCode,
        ...(query?.groupIds ? Array.isArray(query.groupIds) ? { groupIds: query.groupIds } : { groupIds: [query.groupIds] } : {}),
        ...(query?.collectionIds ? Array.isArray(query.collectionIds) ? { collectionIds: query.collectionIds } : { collectionIds: [query.collectionIds] } : {}),
        ...(query?.compositionIds ? Array.isArray(query.compositionIds) ? { compositionIds: query.compositionIds } : { compositionIds: [query.compositionIds] } : {}),
        ...(query?.colorIds ? Array.isArray(query.colorIds) ? { colorIds: query.colorIds } : { colorIds: [query.colorIds] } : {}),
        ...(query?.from ? { from: query.from } : {}),
        ...(query?.to ? { to: query.to } : {}),
        ...(query?.search ? { search: query.search } : {}),
        ...(query?.new ? { new: query.new } : {}),
        ...(query?.bestseller ? { bestseller: query.bestseller } : {}),
        ...(query?.sort ? { sort: query.sort } : {}),
      },
    }),
    ...(groupCode ? [axios.get<ItemGroupResponseInterface>(routes.itemGroup.getByCode({ isServer: false }), {
      params: { code: groupCode },
    })] : [{ data: { itemGroup: null } }]),
  ]);

  return {
    props: {
      items: payloadItems,
      paginationParams,
      itemGroup,
    },
  };
};

export const getServerSideProps = async ({ params, query }: GetServerSidePropsInterface) => {
  try {
    const { data: { links } } = await axios.get<{ links: string[]; }>(routes.item.getLinks({ isServer: false }));

    const { path } = params;

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
      const { data: { item } } = await axios.get<ItemResponseInterface>(routes.item.getByName({ isServer: false }), {
        params: { translateName: itemName },
      });
  
      if (item) {
        const { data: { items: grades, paginationParams } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.item.getGrades({ isServer: false, id: item.id }), {
          params: {
            limit: 10,
            offset: 0,
          },
        });
        item.grades = grades;
  
        return {
          props: {
            item,
            paginationParams,
          },
        };
      }
    }

    return getCatalogServerSideProps({ params, query });
  } catch {
    return {
      redirect: {
        permanent: false,
        destination: routes.page.base.homePage,
      },
    };
  }
};

const Page = ({ item, paginationParams, items, itemGroup }: PagePropsInterface) => (item ? <CardItem item={item} paginationParams={paginationParams} /> : <Catalog items={items} paginationParams={paginationParams} itemGroup={itemGroup} />);

export default Page;
