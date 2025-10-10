 
import { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';

import { routes, catalogPath } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { ItemContext, MobileContext } from '@/components/Context';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

type BreadcrumbState = {
  title: JSX.Element | string;
}

export const Breadcrumb = () => {
  const { t } = useTranslation();
  const router = useRouter();

  const { itemGroups } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const { item } = useContext(ItemContext);
  const { isMobile } = useContext(MobileContext);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbState[]>([]);

  const itemName = item?.translations.find((translation) => translation.lang === lang)?.name;

  useEffect(() => {
    const pathArray = pathname.replace('/', 'index/').split('/').filter(Boolean);
    const linkArray: string[] = [];

    setBreadcrumbs(pathArray.map((folder, index) => {
      if (index === 0) {
        return {
          title: pathArray.length === 1 ? '' : <Link href={routes.page.base.homePage}>{t('modules.navbar.menu.home')}</Link>,
        };
      }
      linkArray.push(folder);
      const itemGroup = itemGroups.find((group) => group.code === folder);
      const link = linkArray.reduce((acc, fold) => `${acc}/${fold}`, '');
      const page = folder === 'catalog'
        ? t('modules.navbar.menu.catalog')
        : item && pathArray.length - 1 === index ? itemName ?? '' : itemGroup?.translations.find((translation) => translation.lang === lang)?.name ?? '';
      return {
        title: pathArray.length - 1 === index ? page : <Link href={link}>{page}</Link>,
      };
    }));
  }, [pathname, itemGroups.length, itemName, lang]);

  return router.pathname.includes(catalogPath)
    ? <BreadcrumbAntd items={breadcrumbs} className="container fs-5 mb-5 font-oswald" separator={<RightOutlined className="fs-6" />} style={{ paddingTop: isMobile ? '25%' : '9%' }} />
    : null;
};
