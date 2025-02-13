import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import { useContext } from 'react';
import { Menu } from 'antd';
import { MenuProps } from 'antd/lib';

import { routes } from '@/routes';
import { useAppSelector } from '@/utilities/hooks';
import { Helmet } from '@/components/Helmet';
import { AuthContext } from '@/components/Context';
import { Personal } from '@/components/profile/Personal';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { Favorites } from '@/components/profile/Favorites';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NoAuthorization } from '@/components/NoAuthorization';
import { Order } from '@/components/profile/Order';
import { Reviews } from '@/components/profile/Reviews';

type MenuItem = Required<MenuProps>['items'][number];

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

  const { pagination } = useAppSelector((state) => state.app);
  const { id, role, favorites } = useAppSelector((state) => state.user);

  const items: MenuItem[] = [
    { key: routes.personalData, label: <Link href={routes.personalData}>{tMenu('menu.personal')}</Link> },
    { key: routes.orderHistory, label: <Link href={routes.orderHistory}>{tMenu('menu.orders')}</Link> },
    { key: routes.favorites, label: <Link href={routes.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: routes.myReviews, label: <Link href={routes.myReviews}>{tMenu('menu.reviews')}</Link> },
    { key: routes.settings, label: <Link href={routes.settings}>{tMenu('menu.settings')}</Link> },
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

  return (
    <>
      <Helmet title={t('title', titleProps)} description={t('description')} />
      {id ? (
        <>
          <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title', titleProps)}</h1>
          <div className="d-flex flex-column flex-md-row">
            <div className="col-4">
              <Menu
                selectedKeys={[router.asPath]}
                mode="inline"
                className="fs-5 font-oswald"
                items={items}
              />
            </div>
            <div className="col-12 col-md-8 d-flex justify-content-center">{getPage()}</div>
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default Page;
