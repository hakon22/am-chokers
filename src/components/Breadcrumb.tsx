/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { RightOutlined } from '@ant-design/icons';
import { routes, catalogPath } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { translate } from '@/utilities/translate';

type BreadcrumbState = {
  title: JSX.Element | string,
  helmet: string,
}

const data = [
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

export const Breadcrumb = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbState[]>([]);

  const helmet = breadcrumbs[breadcrumbs.length - 1]?.helmet;

  useEffect(() => {
    const pathArray = pathname.replace('/', 'index/').split('/').filter(Boolean);
    const linkArray: string[] = [];

    setBreadcrumbs(pathArray.map((folder, index) => {
      if (index === 0) {
        return {
          title: pathArray.length === 1 ? '' : <Link href={routes.homePage}>{t('modules.navbar.menu.home')}</Link>,
          helmet: t('pages.index.title'),
        };
      }
      linkArray.push(folder);
      const itemName = data.find((item) => translate(item.name) === folder)?.name;
      const link = linkArray.reduce((acc, fold) => `${acc}/${fold}`, '');
      const page = folder === 'catalog'
        ? t('modules.navbar.menu.catalog.title')
        : itemName && pathArray.length - 1 === index ? itemName : t(`modules.navbar.menu.catalog.${folder}`);
      return {
        title: pathArray.length - 1 === index ? page : <Link href={link}>{page}</Link>,
        helmet: page,
      };
    }));
  }, [pathname]);

  return router.pathname.includes(catalogPath) ? (
    <>
      <Helmet title={helmet} description={helmet} />
      <BreadcrumbAntd items={breadcrumbs} className="container fs-5 mb-5" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: '9%', fontFamily: 'Oswald, sans-serif' }} />
    </>
  ) : null;
};
