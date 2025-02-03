 
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';

import { routes, catalogPath } from '@/routes';
import { translate } from '@/utilities/translate';
import { useAppSelector } from '@/utilities/hooks';

type BreadcrumbState = {
  title: JSX.Element | string;
}

export const Breadcrumb = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const { items, itemGroups } = useAppSelector((state) => state.app);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbState[]>([]);

  useEffect(() => {
    const pathArray = pathname.replace('/', 'index/').split('/').filter(Boolean);
    const linkArray: string[] = [];

    setBreadcrumbs(pathArray.map((folder, index) => {
      if (index === 0) {
        return {
          title: pathArray.length === 1 ? '' : <Link href={routes.homePage}>{t('modules.navbar.menu.home')}</Link>,
        };
      }
      linkArray.push(folder);
      const item = items.find((itm) => translate(itm.name) === folder);
      const itemGroup = itemGroups.find((group) => group.code === folder);
      const link = linkArray.reduce((acc, fold) => `${acc}/${fold}`, '');
      const page = folder === 'catalog'
        ? t('modules.navbar.menu.catalog')
        : item && pathArray.length - 1 === index ? item.name : itemGroup?.name ?? '';
      return {
        title: pathArray.length - 1 === index ? page : <Link href={link}>{page}</Link>,
      };
    }));
  }, [pathname, items]);

  return router.pathname.includes(catalogPath) ? (
    <>
      <BreadcrumbAntd items={breadcrumbs} className="container fs-5 mb-5 font-oswald" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: '9%' }} />
    </>
  ) : null;
};
