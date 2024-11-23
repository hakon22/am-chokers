import type { InferGetServerSidePropsType } from 'next';
import axios from 'axios';

import { translate } from '@/utilities/translate';
import { CardItem } from '@/components/CardItem';
import { GroupItem } from '@/components/GroupItem';
import type { ItemGroupInterface, ItemInterface } from '@/types/item/Item';
import { routes } from '@/routes';

export const getServerSideProps = async ({ params }: { params: { path: string[] } }) => {
  const [{ data: { items } }, { data: { itemGroups } }] = await Promise.all([
    axios.get<{ items: ItemInterface[] }>(routes.items({ isServer: false })),
    axios.get<{ itemGroups: ItemGroupInterface[] }>(routes.itemGroups({ isServer: false })),
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

  const [groupCode, item] = path;

  return {
    props: item
      ? {
        item: items.find((itm) => translate(itm.name) === item),
      }
      : {
        items: items.filter((itm) => itm.group.code === groupCode),
      },
  };
};

const Page = ({ item, items }: InferGetServerSidePropsType<typeof getServerSideProps>) => (item ? <CardItem {...item} /> : <GroupItem items={items as ItemInterface[]} />);

export default Page;
