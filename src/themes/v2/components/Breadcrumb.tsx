import { useMemo, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { Breadcrumb as BreadcrumbAntd } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import cn from 'classnames';

import { catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { ItemContext, MobileContext, VersionContext, CatalogPageContext } from '@/components/Context';
import { buildCatalogBreadcrumbItems } from '@/utilities/buildCatalogBreadcrumbItems';
import styles from '@/themes/v2/components/Breadcrumb.module.scss';

export const Breadcrumb = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tSeo } = useTranslation('translation', { keyPrefix: 'seo' });
  const router = useRouter();

  const { itemGroups } = useAppSelector((state) => state.app);
  const lang = useUserLang();

  const { item } = useContext(ItemContext);
  const { itemGroup: catalogItemGroup } = useContext(CatalogPageContext);
  const { isMobile } = useContext(MobileContext);
  const { version } = useContext(VersionContext);

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
    <nav className={cn(styles.breadcrumbWrap, { [styles.mobile]: isMobile })} aria-label={tSeo('breadcrumbLabel')}>
      <BreadcrumbAntd
        items={breadcrumbs}
        className="container mb-xl-3"
        separator={<RightOutlined aria-hidden style={{ fontSize: 12 }} />}
        style={{ paddingTop: isMobile && version !== 'v2' ? '56px' : '16px' }}
      />
    </nav>
  );
};
