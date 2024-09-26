import Link from 'next/link';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { InferGetServerSidePropsType } from 'next';
import routes from '@/routes';
import { useTranslation } from 'react-i18next';

export const getServerSideProps = async () => {
  const items = [
    {
      id: 1, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 1', description: '1000 ₽', className: 'me-3', group: 'necklace',
    },
    {
      id: 2, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 2', description: '2000 ₽', className: 'me-3', group: 'bracelets',
    },
    {
      id: 3, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 3', description: '3000 ₽', className: 'me-3', group: 'earrings',
    },
    {
      id: 4, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 4', description: '4000 ₽', className: 'me-3', group: 'accessories',
    },
  ];

  const accumulator: string[] = [];

  return {
    props: {
      groups: items.reduce((acc, item) => {
        if (!acc.includes(item.group)) {
          acc.push(item.group);
        }
        return acc;
      }, accumulator),
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
