import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext } from 'react';
import { Collapse, Divider, Menu } from 'antd';
import type { InferGetServerSidePropsType } from 'next';
import type { CollapseProps, MenuProps } from 'antd/lib';

import { routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { Helmet } from '@/components/Helmet';
import { AuthContext, MobileContext } from '@/components/Context';
import { Personal } from '@/components/profile/Personal';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { Favorites } from '@/components/profile/Favorites';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NoAuthorization } from '@/components/NoAuthorization';
import { Order } from '@/components/profile/Order';
import { Reviews } from '@/components/profile/Reviews';

type MenuItem = Required<MenuProps>['items'][number];
type CollapseItem = Required<CollapseProps>['items'][number];

export const getServerSideProps = async ({ params }: { params: { path: string[] } }) => {
  const { path } = params;

  return {
    props: {
      path,
    },
  };
};

const Page = ({ path }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t: tMenu } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const { t } = useTranslation('translation', { keyPrefix: `pages.profile.${path.length === 1 ? path[0] : `${path[0]}.order`}` });

  const router = useRouter();

  const { logOut } = useContext(AuthContext);
  const { isMobile } = useContext(MobileContext);

  const { pagination } = useAppSelector((state) => state.app);
  const { id, role, favorites } = useAppSelector((state) => state.user);

  const titleProps = {
    id: path[1],
    ...(routes.favorites === router.asPath ? { count: favorites?.length } : {}),
    ...(routes.myReviews === router.asPath ? { count: pagination.count } : {}),
  };

  const pages: Record<string, JSX.Element> = {
    personal: <Personal t={t} />,
    orders: <OrderHistory t={t} />,
    favorites: <Favorites />,
    reviews: <Reviews t={t} />,
    order: <Order orderId={+titleProps.id} t={t} />,
  };

  const getPage = () => {
    if (path[0] === 'orders') {
      return path.length === 1 ? pages.orders : pages.order;
    }
    return pages[path[0]];
  };

  const onCollapse = (keys: string[]) => {
    if (keys.includes('personal')) {
      router.push(routes.personalData);
    } else if (keys.includes('orders')) {
      router.push(routes.orderHistory);
    } else if (keys.includes('favorites')) {
      router.push(routes.favorites);
    } else if (keys.includes('reviews')) {
      router.push(routes.myReviews);
    } else if (keys.includes('settings')) {
      router.push(routes.settings);
    }
  };

  const defaultActiveKey = [...(path[0] === 'orders' ? path.length === 1 ? ['orders'] : ['order'] : path)];

  const mobileItems: CollapseItem[] = [
    { key: 'personal', label: tMenu('menu.personal'), styles: { header: { alignItems: 'center' } }, children: <Personal t={t} /> },
    { key: 'orders', label: tMenu('menu.orders'), styles: { header: { alignItems: 'center' } }, children: <OrderHistory t={t} /> },
    { key: 'favorites', label: tMenu('menu.favorites'), styles: { header: { alignItems: 'center' } }, children: <Favorites /> },
    { key: 'reviews', label: tMenu('menu.reviews'), styles: { header: { alignItems: 'center' } }, children: <Reviews t={t} /> },
    { key: 'settings', label: tMenu('menu.settings'), styles: { header: { alignItems: 'center' } }, children: <div /> },
    ...(role === UserRoleEnum.ADMIN
      ? [{ key: 'admin', label: tMenu('menu.admin.title'), styles: { header: { alignItems: 'center' }, body: { paddingTop: 0 } }, children: <Collapse
        className="fs-6 font-oswald"
        accordion
        ghost
        items={[
          { key: 'items', label: tMenu('menu.admin.items.title'), styles: { header: { alignItems: 'center' }, body: { paddingTop: 0, paddingLeft: '2.5rem' } }, children: <Collapse
            accordion
            ghost
            items={[
              { key: routes.newItem, label: <Link href={routes.newItem}>{tMenu('menu.admin.items.newItem')}</Link>, styles: { header: { paddingBottom: 5 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemGroupsControl, label: <Link href={routes.itemGroupsControl}>{tMenu('menu.admin.items.itemGroups')}</Link>, styles: { header: { paddingBottom: 5 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemCollectionsControl, label: <Link href={routes.itemCollectionsControl}>{tMenu('menu.admin.items.itemCollections')}</Link>, styles: { header: { paddingBottom: 5 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemList, label: <Link href={routes.itemList}>{tMenu('menu.admin.items.itemList')}</Link>, styles: { header: { paddingBottom: 5 } }, showArrow: false, collapsible: 'disabled' },
            ]}
          /> },
          { key: routes.allOrders, label: <Link href={routes.allOrders}>{tMenu('menu.admin.orders')}</Link>, showArrow: false, collapsible: 'disabled' },
          { key: routes.moderationOfReview, label: <Link href={routes.moderationOfReview}>{tMenu('menu.admin.moderationOfReview')}</Link>, showArrow: false, collapsible: 'disabled' },
          { key: routes.promotionalCodes, label: <Link href={routes.promotionalCodes}>{tMenu('menu.admin.promotionalCodes')}</Link>, showArrow: false, collapsible: 'disabled' },
          { key: routes.compositionsControl, label: <Link href={routes.compositionsControl}>{tMenu('menu.admin.compositions')}</Link>, showArrow: false, collapsible: 'disabled' },
        ]}
      /> }]
      : []),
  ];

  const items: MenuItem[] = [
    { key: 'personal', label: <Link href={routes.personalData}>{tMenu('menu.personal')}</Link> },
    { key: 'orders', label: <Link href={routes.orderHistory}>{tMenu('menu.orders')}</Link> },
    { key: 'favorites', label: <Link href={routes.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: 'reviews', label: <Link href={routes.myReviews}>{tMenu('menu.reviews')}</Link> },
    { key: 'settings', label: <Link href={routes.settings}>{tMenu('menu.settings')}</Link> },
    role === UserRoleEnum.ADMIN
      ? { key: 'admin', label: tMenu('menu.admin.title'), children: [
        { key: 'items', label: tMenu('menu.admin.items.title'), children: [
          { key: routes.newItem, label: <Link href={routes.newItem}>{tMenu('menu.admin.items.newItem')}</Link> },
          { key: routes.itemGroupsControl, label: <Link href={routes.itemGroupsControl}>{tMenu('menu.admin.items.itemGroups')}</Link> },
          { key: routes.itemCollectionsControl, label: <Link href={routes.itemCollectionsControl}>{tMenu('menu.admin.items.itemCollections')}</Link> },
          { key: routes.itemList, label: <Link href={routes.itemList}>{tMenu('menu.admin.items.itemList')}</Link> },
        ] },
        { key: routes.allOrders, label: <Link href={routes.allOrders}>{tMenu('menu.admin.orders')}</Link> },
        { key: routes.moderationOfReview, label: <Link href={routes.moderationOfReview}>{tMenu('menu.admin.moderationOfReview')}</Link> },
        { key: routes.promotionalCodes, label: <Link href={routes.promotionalCodes}>{tMenu('menu.admin.promotionalCodes')}</Link> },
        { key: routes.compositionsControl, label: <Link href={routes.compositionsControl}>{tMenu('menu.admin.compositions')}</Link> },
      ],
      } : null,
    { type: 'divider' },
    { key: 'logout', label: <button type="button" className="button-link w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button> },
  ];

  return (
    <>
      <Helmet title={t('title', titleProps)} description={t('description')} />
      {id ? (
        <>
          {!isMobile
            ? <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title', titleProps)}</h1>
            : null}
          <div className="d-flex flex-column flex-md-row" style={isMobile ? { marginTop: '30%' } : {}}>
            {isMobile
              ? (
                <>
                  <Collapse
                    defaultActiveKey={defaultActiveKey}
                    className="mb-3 fs-5 font-oswald"
                    accordion
                    ghost
                    onChange={onCollapse}
                    items={mobileItems}
                  />
                  <Divider className="my-0" /> 
                  <Collapse ghost className="fs-5 ms-4 font-oswald" items={[{ key: 'logout', label: <button type="button" className="button-link w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button>, collapsible: 'disabled', showArrow: false }]} />
                </>
              )
              : (
                <>
                  <div className="col-4">
                    <Menu
                      selectedKeys={[router.asPath]}
                      mode="inline"
                      className="fs-5 font-oswald"
                      items={items}
                    />
                  </div>
                  <div className="col-12 col-md-8 d-flex justify-content-center">{getPage()}</div>
                </>
              )}
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default Page;
