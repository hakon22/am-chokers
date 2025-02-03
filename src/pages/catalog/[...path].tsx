import axios from 'axios';
import type { InferGetServerSidePropsType } from 'next';

import { CardItem } from '@/components/CardItem';
import { GroupItem } from '@/components/GroupItem';
import { routes } from '@/routes';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { ItemGroupResponseInterface, ItemResponseInterface } from '@/slices/appSlice';

export const getServerSideProps = async ({ params }: { params: { path: string[]; } }) => {
  const { data: { links } } = await axios.get<{ links: string[]; }>(routes.getItemLinks({ isServer: false }));

  const { path } = params;

  const [groupCode, itemName] = path;

  if (path.length > 2 || path.find((link) => !links.includes(link))) {
    return {
      redirect: {
        permanent: false,
        destination: routes.homePage,
      },
    };
  }

  if (itemName) {
    const { data: { item } } = await axios.get<ItemResponseInterface>(routes.getItemByName({ isServer: false }), {
      params: { translateName: itemName },
    });
  
    if (item) {
      const { data: { items: grades, paginationParams } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.getGrades({ isServer: false, id: item.id }), {
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

  const [{ data: { items: payloadItems, paginationParams } }, { data: { itemGroup } }] = await Promise.all([
    axios.get<PaginationEntityInterface<ItemInterface>>(routes.getItemList({ isServer: false }), {
      params: {
        limit: 10,
        offset: 0,
        groupCode,
      },
    }),
    axios.get<ItemGroupResponseInterface>(routes.getItemGroupByCode({ isServer: false }), {
      params: { code: groupCode },
    }),
  ]);

  return {
    props: {
      items: payloadItems,
      paginationParams,
      itemGroup,
    },
  };
};

const Page = ({ item, paginationParams, items, itemGroup }: InferGetServerSidePropsType<typeof getServerSideProps>) => (item ? <CardItem item={item} paginationParams={paginationParams} /> : <GroupItem items={items} paginationParams={paginationParams} itemGroup={itemGroup} />);

export default Page;
