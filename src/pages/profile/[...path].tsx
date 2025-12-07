import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext, useEffect, useEffectEvent, useState, type JSX } from 'react';
import { Button, Collapse, Divider, Menu, Skeleton } from 'antd';
import type { InferGetServerSidePropsType } from 'next';
import type { CollapseProps, MenuProps } from 'antd/lib';

import { routes } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { Helmet } from '@/components/Helmet';
import { AuthContext, MobileContext } from '@/components/Context';
import { Personal } from '@/components/profile/Personal';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { Favorites } from '@/components/profile/Favorites';
import { NoAuthorization } from '@/components/NoAuthorization';
import { Order } from '@/components/profile/Order';
import { Reviews } from '@/components/profile/Reviews';
import { AdminSettings } from '@/components/AdminSettings';

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

  const [activeKey, setActiveKey] = useState(path);

  const setActiveKeyEffect = useEffectEvent(setActiveKey);

  const { pagination } = useAppSelector((state) => state.app);
  const { id, isAdmin, favorites } = useAppSelector((state) => state.user);

  const titleProps = {
    id: path[1],
    ...(routes.page.profile.favorites === router.asPath ? { count: favorites?.length } : {}),
    ...(routes.page.profile.myReviews === router.asPath ? { count: pagination.count } : {}),
  };

  const pages: Record<string, JSX.Element> = {
    personal: <Personal />,
    orders: <OrderHistory />,
    favorites: <Favorites />,
    reviews: <Reviews />,
    order: <Order orderId={+titleProps.id} />,
    adminSettings: <AdminSettings />,
  };

  const getPage = () => {
    if (path[0] === 'orders') {
      return path.length === 1 ? pages.orders : pages.order;
    }
    return isMobile ? <Skeleton active /> : pages[path[0]];
  };

  const onCollapse = (keys: string[]) => {
    setActiveKey(keys);
    if (keys.includes('personal')) {
      router.push(routes.page.profile.personalData);
    } else if (keys.includes('orders')) {
      router.push(routes.page.profile.orderHistory);
    } else if (keys.includes('favorites')) {
      router.push(routes.page.profile.favorites);
    } else if (keys.includes('reviews')) {
      router.push(routes.page.profile.myReviews);
    } else if (keys.includes('settings')) {
      router.push(routes.page.profile.settings);
    }
  };

  const mobileItems: CollapseItem[] = [
    { key: 'personal', label: tMenu('menu.personal'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Personal /> },
    { key: 'orders', label: tMenu('menu.orders'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: getPage() },
    { key: 'favorites', label: tMenu('menu.favorites'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Favorites /> },
    { key: 'reviews', label: tMenu('menu.reviews'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Reviews /> },
    // { key: 'settings', label: tMenu('menu.settings'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <div /> },
    ...(isAdmin
      ? [{ key: 'admin', label: tMenu('menu.admin.title'), styles: { header: { alignItems: 'center', paddingLeft: 0 }, body: { paddingTop: 0 } }, children: <Collapse
        className="fs-6 font-oswald"
        accordion
        ghost
        items={[
          { key: 'items', label: tMenu('menu.admin.items.title'), styles: { header: { alignItems: 'center', paddingLeft: 0 }, body: { paddingTop: 0, paddingLeft: '2.5rem' } }, children: <Collapse
            accordion
            ghost
            items={[
              { key: routes.page.admin.deferredPublication, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.deferredPublication}>{tMenu('menu.admin.items.deferredPublication')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.page.admin.newItem, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.newItem}>{tMenu('menu.admin.items.newItem')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.page.admin.itemGroupsControl, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.itemGroupsControl}>{tMenu('menu.admin.items.itemGroups')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.page.admin.itemCollectionsControl, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.itemCollectionsControl}>{tMenu('menu.admin.items.itemCollections')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.page.admin.itemList, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.itemList}>{tMenu('menu.admin.items.itemList')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
            ]}
          /> },
          { key: 'reports', label: tMenu('menu.admin.reports.title'), styles: { header: { alignItems: 'center', paddingLeft: 0 }, body: { paddingTop: 0, paddingLeft: '2.5rem' } }, children: <Collapse
            accordion
            ghost
            items={[
              { key: routes.reports.users, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.userList}>{tMenu('menu.admin.reports.users')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.reports.cart, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.cartReport}>{tMenu('menu.admin.reports.cart')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.reports.message, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.page.admin.messageReport}>{tMenu('menu.admin.reports.message')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
            ]}
          /> },
          { key: routes.page.admin.allOrders, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.page.admin.allOrders}>{tMenu('menu.admin.orders')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.page.admin.moderationOfReview, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.page.admin.moderationOfReview}>{tMenu('menu.admin.moderationOfReview')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.page.admin.promotionalCodes, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.page.admin.promotionalCodes}>{tMenu('menu.admin.promotionalCodes')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.page.admin.compositionsControl, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.page.admin.compositionsControl}>{tMenu('menu.admin.compositions')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.page.admin.colorsControl, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.page.admin.colorsControl}>{tMenu('menu.admin.colors')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: 'adminSettings', label: tMenu('menu.admin.adminSettings'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <AdminSettings /> },
        ]}
      /> }]
      : []),
  ];

  const items: MenuItem[] = [
    { key: 'personal', label: <Link href={routes.page.profile.personalData}>{tMenu('menu.personal')}</Link> },
    { key: 'orders', label: <Link href={routes.page.profile.orderHistory}>{tMenu('menu.orders')}</Link> },
    { key: 'favorites', label: <Link href={routes.page.profile.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: 'reviews', label: <Link href={routes.page.profile.myReviews}>{tMenu('menu.reviews')}</Link> },
    // { key: 'settings', label: <Link href={routes.page.profile.settings}>{tMenu('menu.settings')}</Link> },
    isAdmin
      ? { key: 'admin', label: tMenu('menu.admin.title'), children: [
        { key: 'items', label: tMenu('menu.admin.items.title'), children: [
          { key: routes.page.admin.deferredPublication, label: <Link href={routes.page.admin.deferredPublication}>{tMenu('menu.admin.items.deferredPublication')}</Link> },
          { key: routes.page.admin.newItem, label: <Link href={routes.page.admin.newItem}>{tMenu('menu.admin.items.newItem')}</Link> },
          { key: routes.page.admin.itemGroupsControl, label: <Link href={routes.page.admin.itemGroupsControl}>{tMenu('menu.admin.items.itemGroups')}</Link> },
          { key: routes.page.admin.itemCollectionsControl, label: <Link href={routes.page.admin.itemCollectionsControl}>{tMenu('menu.admin.items.itemCollections')}</Link> },
          { key: routes.page.admin.itemList, label: <Link href={routes.page.admin.itemList}>{tMenu('menu.admin.items.itemList')}</Link> },
        ] },
        { key: 'reports', label: tMenu('menu.admin.reports.title'), children: [
          { key: routes.reports.users, label: <Link href={routes.page.admin.userList}>{tMenu('menu.admin.reports.users')}</Link> },
          { key: routes.reports.cart, label: <Link href={routes.page.admin.cartReport}>{tMenu('menu.admin.reports.cart')}</Link> },
          { key: routes.reports.message, label: <Link href={routes.page.admin.messageReport}>{tMenu('menu.admin.reports.message')}</Link> },
        ] },
        { key: routes.page.admin.allOrders, label: <Link href={routes.page.admin.allOrders}>{tMenu('menu.admin.orders')}</Link> },
        { key: routes.page.admin.moderationOfReview, label: <Link href={routes.page.admin.moderationOfReview}>{tMenu('menu.admin.moderationOfReview')}</Link> },
        { key: routes.page.admin.promotionalCodes, label: <Link href={routes.page.admin.promotionalCodes}>{tMenu('menu.admin.promotionalCodes')}</Link> },
        { key: routes.page.admin.compositionsControl, label: <Link href={routes.page.admin.compositionsControl}>{tMenu('menu.admin.compositions')}</Link> },
        { key: routes.page.admin.colorsControl, label: <Link href={routes.page.admin.colorsControl}>{tMenu('menu.admin.colors')}</Link> },
        { key: routes.page.admin.adminSettings, label: <Link href={routes.page.admin.adminSettings}>{tMenu('menu.admin.adminSettings')}</Link> },
      ],
      } : null,
    { type: 'divider' },
    { key: 'logout', label: <button type="button" className="button-link py-1 w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button> },
  ];

  useEffect(() => {
    setActiveKeyEffect(path[1] ? ['orders'] : path);
  }, [path[0], path[1]]);
  
  return (
    <>
      <Helmet title={t('title', titleProps)} description={t('description', titleProps)} />
      {id ? (
        <>
          {!isMobile
            ? <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: '12%' }}>{t('title', titleProps)}</h1>
            : null}
          <div className="d-flex flex-column flex-xl-row" style={isMobile ? { marginTop: '100px' } : {}}>
            {isMobile
              ? (
                <>
                  <Collapse
                    defaultActiveKey={path[1] ? ['orders'] : path}
                    activeKey={activeKey}
                    className="mb-3 fs-5 font-oswald"
                    rootClassName="collapse-without-padding"
                    accordion
                    ghost
                    onChange={onCollapse}
                    items={mobileItems}
                  />
                  <Divider className="my-0" /> 
                  <Collapse ghost className="fs-5 ms-4 font-oswald" items={[{ key: 'logout', label: <button type="button" className="button-link w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button>, collapsible: 'disabled', showArrow: false, styles: { header: { paddingLeft: 0 } } }]} />
                </>
              )
              : (
                <>
                  <div className="col-3">
                    <Menu
                      mode="inline"
                      className="fs-5 font-oswald"
                      selectedKeys={activeKey}
                      items={items}
                    />
                  </div>
                  <div className="col-12 col-xl-9 d-flex justify-content-center">{getPage()}</div>
                </>
              )}
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default Page;
