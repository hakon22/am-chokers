import type { InferGetServerSidePropsType } from 'next';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { translate } from '@/utilities/translate';
import i18n from '@/locales';
import { CardItem } from '@/components/CardItem';
import { GroupItem } from '@/components/GroupItem';
import { ItemInterface } from '@/types/item/Item';

export const getServerSideProps = async ({ params }: { params: { path: string[] } }) => {
  const items: ItemInterface[] = [
    {
      id: 1, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 1', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 1000, rating: 1.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'necklace',
    },
    {
      id: 2, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 2', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 1000, rating: 2.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'bracelets',
    },
    {
      id: 3, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 3', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 1000, rating: 3.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'earrings',
    },
    {
      id: 4, images: [choker2.src, choker3.src], width: 400, height: 400, name: 'Товар 4', description: 'Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.', price: 1000, rating: 4.3, composition: 'Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав', length: '40 см + регулировка 6 см', className: 'me-3', group: 'accessories',
    },
  ] as unknown as ItemInterface[];

  const { t } = i18n;

  const accumulator: string[] = [];

  const links = [...Object.keys(t('modules.navbar.menu.catalog', { returnObjects: true })), ...items.reduce((acc, item) => {
    if (!acc.includes(translate(item.name))) {
      acc.push(translate(item.name));
    }
    return acc;
  }, accumulator)];

  const { path } = params;

  if (path.length > 2 || path.find((url) => !links.includes(url))) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    };
  }

  const [group, item] = path;

  return {
    props: item
      ? {
        item: items.find((itm) => translate(itm.name) === item),
      }
      : {
        items: items.filter((itm) => itm.group === group as unknown as ItemInterface['group']),
      },
  };
};

const Page = ({ item, items }: InferGetServerSidePropsType<typeof getServerSideProps>) => (item ? <CardItem {...item} /> : <GroupItem items={items as ItemInterface[]} />);

export default Page;
