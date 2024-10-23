import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { InferGetServerSidePropsType } from 'next';
import { Helmet } from '@/components/Helmet';
import Link from 'next/link';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { useContext, useEffect } from 'react';
import { routes } from '@/routes';
import { setUrl } from '@/slices/userSlice';
import { Menu } from 'antd';
import { MenuProps } from 'antd/lib';
import type { TFunction } from 'i18next';
import { AuthContext } from '@/components/Context';
import { Personal } from '@/components/forms/profile/Personal';

type MenuItem = Required<MenuProps>['items'][number];

export const getServerSideProps = async ({ params }: { params: { page: string } }) => {
  const { page } = params;

  return {
    props: {
      page,
    },
  };
};

const NoAuthorization = ({ t }: { t: TFunction }) => (
  <div className="d-flex flex-column flex-md-row justify-content-center align-items-center fs-5" style={{ letterSpacing: '0.5px', marginTop: '22%' }}>
    {t('entrace1')}
    <Link href={routes.loginPage} className="px-2 text-monospace text-decoration-underline">{t('entrace')}</Link>
    {t('entrace2')}
    <Link href={routes.signupPage} className="ps-2 text-monospace text-decoration-underline">{t('signup')}</Link>
  </div>
);

const Page = ({ page }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t: tMenu } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const { t } = useTranslation('translation', { keyPrefix: `pages.profile.${page}` });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { logOut } = useContext(AuthContext);

  const { id, role } = useAppSelector((state) => state.user);

  const items: MenuItem[] = [
    { key: routes.personalData, label: <Link href={routes.personalData}>{tMenu('menu.personal')}</Link> },
    { key: routes.orderHistory, label: <Link href={routes.orderHistory}>{tMenu('menu.order')}</Link> },
    { key: routes.favorites, label: <Link href={routes.favorites}>{tMenu('menu.favorites')}</Link> },
    { key: routes.myReviews, label: <Link href={routes.myReviews}>{tMenu('menu.reviews')}</Link> },
    { key: routes.settings, label: <Link href={routes.settings}>{tMenu('menu.settings')}</Link> },
    { type: 'divider' },
    { key: 'logout', label: <button type="button" className="button-link" onClick={logOut}>{tMenu('menu.logout')}</button> },
  ];

  useEffect(() => {
    if (!id) {
      dispatch(setUrl(router.asPath));
    }
  }, [id]);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {id ? (
        <>
          <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title')}</h1>
          <div className="d-flex">
            <div className="col-4">
              <Menu
                selectedKeys={[router.asPath]}
                mode="inline"
                style={{ fontFamily: 'Oswald, sans-serif' }}
                className="fs-5"
                items={items}
              />
            </div>
            <div className="col-8 d-flex justify-content-center"><Personal t={t} /></div>
          </div>
        </>
      ) : <NoAuthorization t={tMenu} />}
    </>
  );
};

export default Page;
