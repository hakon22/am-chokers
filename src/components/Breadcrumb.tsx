/* eslint-disable no-nested-ternary */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import routes from '@/routes';
import { Helmet } from '@/components/Helmet';

type BreadcrumbState = {
  title: JSX.Element | string,
  helmet: string,
}

export const Breadcrumb = ({ name }: { name?: string }) => {
  const { t } = useTranslation();
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
      const link = linkArray.reduce((acc, fold) => `${acc}/${fold}`, '');
      const page = folder === 'catalog'
        ? t('modules.navbar.menu.catalog.title')
        : name && pathArray.length - 1 === index ? name : t(`modules.navbar.menu.catalog.${folder}`);
      return {
        title: pathArray.length - 1 === index ? page : <Link href={link}>{page}</Link>,
        helmet: page,
      };
    }));
  }, [pathname]);

  return (
    <>
      <Helmet
        title={helmet ?? t('pages.index.title')}
        description={helmet ?? t('pages.index.description')}
      />
      <BreadcrumbAntd items={breadcrumbs} className="fs-5 mb-5" separator={<RightOutlined className="fs-6" />} style={{ marginTop: '10%', fontFamily: 'Oswald, sans-serif' }} />
    </>
  );
};
