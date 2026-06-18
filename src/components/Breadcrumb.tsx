import { useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import cn from 'classnames';

import { catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { ItemContext, MobileContext, CatalogPageContext } from '@/components/Context';
import { buildCatalogBreadcrumbItems } from '@/utilities/buildCatalogBreadcrumbItems';

export const Breadcrumb = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tSeo } = useTranslation('translation', { keyPrefix: 'seo' });
  const router = useRouter();

  const { itemGroups } = useAppSelector((state) => state.app);
  const lang = useUserLang();

  const { item } = useContext(ItemContext);
  const { itemGroup: catalogItemGroup } = useContext(CatalogPageContext);
  const { isMobile } = useContext(MobileContext);

  const breadcrumbs = useMemo(() => buildCatalogBreadcrumbItems({
    asPath: router.asPath,
    itemGroups,
    lang,
    item,
    catalogItemGroup,
    t,
  }),
  [router.asPath, itemGroups, lang, item, catalogItemGroup, t]);

  if (!router.pathname.includes(catalogPath) || breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav
      className="w-100 pb-3 pb-xl-0 breadcrumb-one-line"
      aria-label={tSeo('breadcrumbLabel')}
      style={{ ...(isMobile ? { position: 'fixed', top: '-15px', zIndex: 5, backgroundColor: '#f7f9fc' } : {}) }}
    >
      <BreadcrumbAntd
        items={breadcrumbs}
        className={cn('container mb-xl-5 font-oswald', { 'fs-6': isMobile, 'fs-5': !isMobile })}
        separator={<RightOutlined aria-hidden className={cn({ 'fs-6': !isMobile })} />}
        style={{ paddingTop: isMobile ? '90px' : '9%' }}
      />
    </nav>
  );
};
