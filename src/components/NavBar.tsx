import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/utilities/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import routes from '@/routes';
import logo from '@/images/logo.svg';
import person from '@/images/icons/person.svg';
import { Menu, type MenuProps } from 'antd';

type MenuItem = Required<MenuProps>['items'][number];

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const { id, role } = useAppSelector((state) => state.user);

  const items: MenuItem[] = [
    {
      label: t('menu.catalog'),
      key: 'catalog',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: t('menu.aboutBrand'),
      key: 'aboutBrand',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: t('menu.delivery'),
      key: 'delivery',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: t('menu.jewelryCaring'),
      key: 'jewelryCaring',
      onTitleClick: () => router.push(routes.homePage),
    },
    {
      label: t('menu.contacts'),
      key: 'contacts',
      onTitleClick: () => router.push(routes.homePage),
    },
  ];

  return (
    <nav className="nav d-flex justify-content-between align-items-center">
      <Image src={logo} alt={t('logo')} priority role="button" onClick={() => router.push(routes.homePage)} style={{ zIndex: 2 }} />
      <Menu items={items} mode="horizontal" className="nav-menu" style={{ zIndex: 2 }} />
      <div className="nav-icons" style={{ zIndex: 2 }}>
        <button className="icon-button" type="button" title={t('search')}>
          <SearchOutlined className="icon" />
          <span className="visually-hidden">{t('search')}</span>
        </button>
        <button className="icon-button" type="button" title={t('favorites')}>
          <HeartOutlined className="icon" />
          <span className="visually-hidden">{t('favorites')}</span>
        </button>
        <button className="icon-button" type="button" title={t('cart')}>
          <ShoppingCartOutlined className="icon" />
          <span className="visually-hidden">{t('cart')}</span>
        </button>
        <button className="icon-button" type="button" title={t('profile')}>
          <Image src={person} alt={t('logo')} priority />
          <span className="visually-hidden">{t('profile')}</span>
        </button>
      </div>
    </nav>
  );
};
