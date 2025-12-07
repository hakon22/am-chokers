 
import { useEffect, useState, useContext, type JSX, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import cn from 'classnames';

import { routes, catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
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

  const setBreadcrumbsEffect = useEffectEvent(setBreadcrumbs);

  const itemName = item?.translations.find((translation) => translation.lang === lang)?.name;

  useEffect(() => {
    const pathArray = pathname.replace('/', 'index/').split('/').filter(Boolean);
    const linkArray: string[] = [];

    setBreadcrumbsEffect(pathArray.map((folder, index) => {
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
        title: pathArray.length - 1 === index && folder !== 'catalog' ? page : <Link href={link}>{page}</Link>,
      };
    }));
  }, [pathname, itemGroups.length, itemName, lang]);

  return router.pathname.includes(catalogPath)
    ? (
      <div className="w-100 pb-3 pb-xl-0 breadcrumb-one-line" style={{ ...(isMobile ? { position: 'fixed', top: '-15px', zIndex: 5, backgroundColor: '#f7f9fc' } : {}) }} >
        <BreadcrumbAntd items={breadcrumbs} className={cn('container mb-xl-5 font-oswald', { 'fs-6': isMobile, 'fs-5': !isMobile })} separator={<RightOutlined className={cn({ 'fs-6': !isMobile })} />} style={{ paddingTop: isMobile ? '90px' : '9%' }} />
      </div>
    )
    : null;
};
