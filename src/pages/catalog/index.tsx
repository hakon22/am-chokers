import Link from 'next/link';
import { InferGetServerSidePropsType } from 'next';
import { useTranslation } from 'react-i18next';

import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { routes } from '@/routes';


export const getServerSideProps = async () => {
  const items = [
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
  ];

  return {
    props: {
      groups: items.reduce((acc, item) => {
        if (!acc.includes(item.group)) {
          acc.push(item.group);
        }
        return acc;
      }, [] as string[]),
    },
  };
};

const Catalog = ({ groups }:
  InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });

  return (
    <div className="d-flex col-12 justify-content-between">
      {groups?.map((group) => (
        <Link href={`${routes.catalog}/${group}`} style={{ width: '23%' }} className="text-center" key={group}>
          {t(`menu.catalog.${group}`)}
        </Link>
      ))}
    </div>
  );
};

export default Catalog;
