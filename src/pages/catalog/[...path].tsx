import type { InferGetServerSidePropsType } from 'next';
import axios from 'axios';

import { translate } from '@/utilities/translate';
import { CardItem } from '@/components/CardItem';
import { GroupItem } from '@/components/GroupItem';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { routes } from '@/routes';

export const getServerSideProps = async ({ params }: { params: { path: string[] } }) => {
  const [{ data: { items } }, { data: { itemGroups } }] = await Promise.all([
    axios.get<{ items: ItemInterface[] }>(routes.getItems({ isServer: false })),
    axios.get<{ itemGroups: ItemGroupInterface[] }>(routes.getItemGroups({ isServer: false })),
  ]);

  const links = [
    ...itemGroups.reduce((acc, { code }) => {
      if (!acc.includes(code)) {
        acc.push(code);
      }
      return acc;
    }, [] as string[]),
    ...items.reduce((acc, item) => {
      if (!acc.includes(translate(item.name))) {
        acc.push(translate(item.name));
      }
      return acc;
    }, [] as string[]),
  ];

  const { path } = params;

  if (path.length > 2 || path.find((link) => !links.includes(link))) {
    return {
      redirect: {
        permanent: false,
        destination: routes.homePage,
      },
    };
  }

  const [groupCode, itemName] = path;

  const item = items.find((itm) => translate(itm.name) === itemName);

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

  return {
    props: {
      items: items.filter((itm) => itm.group.code === groupCode),
    },
  };
};

const Page = ({ item, paginationParams, items }: InferGetServerSidePropsType<typeof getServerSideProps>) => (item ? <CardItem item={item} paginationParams={paginationParams} /> : <GroupItem items={items as ItemInterface[]} />);

export default Page;
