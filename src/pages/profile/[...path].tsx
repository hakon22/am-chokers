import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { InferGetServerSidePropsType } from 'next';
import Link from 'next/link';
import { useContext, useEffect } from 'react';
import { Menu } from 'antd';
import { MenuProps } from 'antd/lib';

import { setUrl } from '@/slices/userSlice';
import { routes } from '@/routes';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { Helmet } from '@/components/Helmet';
import { AuthContext } from '@/components/Context';
import { Personal } from '@/components/profile/Personal';
import { OrderHistory } from '@/components/profile/OrderHistory';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NoAuthorization } from '@/components/NoAuthorization';

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

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logOut } = useContext(AuthContext);

  const { id, role } = useAppSelector((state) => state.user);

  const items: MenuItem[] = [
    { key: routes.personalData, label: <Link href={routes.personalData}>{tMenu('menu.personal')}</Link> },
    { key: routes.orderHistory, label: <Link href={routes.orderHistory}>{tMenu('menu.orders')}</Link> },
    { key: routes.favorites, label: <Link href={routes.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: routes.myReviews, label: <Link href={routes.myReviews}>{tMenu('menu.reviews')}</Link> },
    { key: routes.settings, label: <Link href={routes.settings}>{tMenu('menu.settings')}</Link> },
    role === UserRoleEnum.ADMIN
      ? { key: 'admin', label: tMenu('menu.admin.title'), children: [
        { key: routes.newItem, label: <Link href={routes.newItem}>{tMenu('menu.admin.newItem')}</Link> },
        { key: routes.itemGroupsControl, label: <Link href={routes.itemGroupsControl}>{tMenu('menu.admin.itemGroups')}</Link> },
        { key: routes.itemCollectionsControl, label: <Link href={routes.itemCollectionsControl}>{tMenu('menu.admin.itemCollections')}</Link> },
      ],
      } : null,
    { type: 'divider' },
    { key: 'logout', label: <button type="button" className="button-link w-100 text-start" onClick={logOut}>{tMenu('menu.logout')}</button> },
  ];

  const pages: Record<string, JSX.Element> = {
    personal: <Personal t={t} />,
    orders: <OrderHistory t={t} />,
    order: <div>order</div>,
  };

  const getPage = () => {
    if (path[0] === 'orders') {
      if (path.length === 1) {
        return pages.orders;
      }
      return pages.order;
    }
    return pages[path[0]];
  };

  useEffect(() => {
    if (!id) {
      dispatch(setUrl(router.asPath));
    }
  }, [id]);

  return (
    <>
      <Helmet title={t('title', { id: path[1] })} description={t('description')} />
      {id ? (
        <>
          <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title', { id: path[1] })}</h1>
          <div className="d-flex">
            <div className="col-4">
              <Menu
                selectedKeys={[router.asPath]}
                mode="inline"
                className="fs-5 font-oswald"
                items={items}
              />
            </div>
            <div className="col-8 d-flex justify-content-center">{getPage()}</div>
          </div>
        </>
      ) : <NoAuthorization />}
    </>
  );
};

export default Page;
