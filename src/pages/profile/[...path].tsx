import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useContext, useEffect, useState } from 'react';
import { Button, Collapse, Divider, Menu, Skeleton } from 'antd';
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

  const [activeKey, setActiveKey] = useState(path);

  const { pagination } = useAppSelector((state) => state.app);
  const { id, role, favorites } = useAppSelector((state) => state.user);

  const titleProps = {
    id: path[1],
    ...(routes.favorites === router.asPath ? { count: favorites?.length } : {}),
    ...(routes.myReviews === router.asPath ? { count: pagination.count } : {}),
  };

  const pages: Record<string, JSX.Element> = {
    personal: <Personal />,
    orders: <OrderHistory />,
    favorites: <Favorites />,
    reviews: <Reviews />,
    order: <Order orderId={+titleProps.id} />,
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

  const mobileItems: CollapseItem[] = [
    { key: 'personal', label: tMenu('menu.personal'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Personal /> },
    { key: 'orders', label: tMenu('menu.orders'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: getPage() },
    { key: 'favorites', label: tMenu('menu.favorites'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Favorites /> },
    { key: 'reviews', label: tMenu('menu.reviews'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <Reviews /> },
    // { key: 'settings', label: tMenu('menu.settings'), styles: { header: { alignItems: 'center', paddingLeft: 0 } }, children: <div /> },
    ...(role === UserRoleEnum.ADMIN
      ? [{ key: 'admin', label: tMenu('menu.admin.title'), styles: { header: { alignItems: 'center', paddingLeft: 0 }, body: { paddingTop: 0 } }, children: <Collapse
        className="fs-6 font-oswald"
        accordion
        ghost
        items={[
          { key: 'items', label: tMenu('menu.admin.items.title'), styles: { header: { alignItems: 'center', paddingLeft: 0 }, body: { paddingTop: 0, paddingLeft: '2.5rem' } }, children: <Collapse
            accordion
            ghost
            items={[
              { key: routes.newItem, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.newItem}>{tMenu('menu.admin.items.newItem')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemGroupsControl, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.itemGroupsControl}>{tMenu('menu.admin.items.itemGroups')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemCollectionsControl, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.itemCollectionsControl}>{tMenu('menu.admin.items.itemCollections')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
              { key: routes.itemList, label: <Button className="button-link text-start fs-6" style={{ boxShadow: 'none' }} href={routes.itemList}>{tMenu('menu.admin.items.itemList')}</Button>, styles: { header: { paddingBottom: 5, paddingLeft: 0 } }, showArrow: false, collapsible: 'disabled' },
            ]}
          /> },
          { key: routes.allOrders, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.allOrders}>{tMenu('menu.admin.orders')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.moderationOfReview, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.moderationOfReview}>{tMenu('menu.admin.moderationOfReview')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.promotionalCodes, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.promotionalCodes}>{tMenu('menu.admin.promotionalCodes')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.compositionsControl, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.compositionsControl}>{tMenu('menu.admin.compositions')}</Button>, showArrow: false, collapsible: 'disabled' },
          { key: routes.colorsControl, label: <Button className="button-link text-start fs-6 ms-2" style={{ boxShadow: 'none' }} href={routes.colorsControl}>{tMenu('menu.admin.colors')}</Button>, showArrow: false, collapsible: 'disabled' },
        ]}
      /> }]
      : []),
  ];

  const items: MenuItem[] = [
    { key: 'personal', label: <Link href={routes.personalData}>{tMenu('menu.personal')}</Link> },
    { key: 'orders', label: <Link href={routes.orderHistory}>{tMenu('menu.orders')}</Link> },
    { key: 'favorites', label: <Link href={routes.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: 'reviews', label: <Link href={routes.myReviews}>{tMenu('menu.reviews')}</Link> },
    // { key: 'settings', label: <Link href={routes.settings}>{tMenu('menu.settings')}</Link> },
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
        { key: routes.colorsControl, label: <Link href={routes.colorsControl}>{tMenu('menu.admin.colors')}</Link> },
      ],
      } : null,
    { type: 'divider' },
    { key: 'logout', label: <button type="button" className="button-link w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button> },
  ];

  useEffect(() => {
    setActiveKey(path[1] ? ['orders'] : path);
  }, [path[0], path[1]]);
  
  return (
    <>
      <Helmet title={t('title', titleProps)} description={t('description')} />
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
                  <div className="col-4">
                    <Menu
                      mode="inline"
                      className="fs-5 font-oswald"
                      selectedKeys={activeKey}
                      items={items}
                    />
                  </div>
                  <div className="col-12 col-xl-8 d-flex justify-content-center">{getPage()}</div>
                </>
              )}
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default Page;
