/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/utilities/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import routes from '@/routes';
import logo from '@/images/logo.svg';
import person from '@/images/icons/person.svg';
import { Menu, type MenuProps } from 'antd';
import { MouseEvent as ReactMouseEvent, useEffect, useState } from 'react';
import { Navbar as NavBarBootstrap, NavDropdown } from 'react-bootstrap';

type NavigationKeys = {
  key: 'catalog' | 'aboutBrand' | 'delivery' | 'jewelryCaring' | 'contacts';
};

type MenuItem = Required<MenuProps>['items'][number] & NavigationKeys;

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const [submenu, setSubmenu] = useState<NavigationKeys['key']>();
  const [navHeight, setNavHeight] = useState<string>('7vw');

  const { id, role } = useAppSelector((state) => state.user);

  const onTitleMouseEnter = ({ key }: any) => setSubmenu(key);

  const onTitleMouseLeave = ({ domEvent }: { domEvent: ReactMouseEvent<HTMLElement, MouseEvent> }) => {
    const target = domEvent.relatedTarget as Element;
    if (target?.classList?.contains('ant-menu-submenu-horizontal')) {
      setSubmenu(undefined);
    }
  };

  const items: MenuItem[] = [
    {
      label: t('menu.catalog'),
      key: 'catalog',
      onTitleClick: () => router.push(routes.homePage),
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: [{ label: 'Привет', key: 'hi' }, { label: 'Второй элемент более длинный', key: 'hi2' }],
    },
    {
      label: t('menu.aboutBrand'),
      key: 'aboutBrand',
      onTitleClick: () => router.push(routes.homePage),
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: [{ label: 'Привет', key: 'h3i' }, { label: 'Второй элемент более длинный', key: 'hi32' }, { label: 'Третий элемент', key: '4hi32' }],
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
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: [{ label: 'Привет', key: 'h4i' }, { label: 'Второй элемент более длинный', key: 'hi24' }],
    },
    {
      label: t('menu.contacts'),
      key: 'contacts',
      onTitleClick: () => router.push(routes.homePage),
    },
  ];

  useEffect(() => {
    if (!submenu) {
      setNavHeight('7vw');
    } else if (submenu === 'catalog' || submenu === 'jewelryCaring') {
      setNavHeight('13vw');
    } else if (submenu === 'aboutBrand') {
      setNavHeight('16vw');
    }
  }, [submenu]);

  return (
    <nav className="nav" style={{ height: navHeight }}>
      <Image src={logo} className="nav-logo" alt={t('logo')} priority role="button" onClick={() => router.push(routes.homePage)} />
      <div className="nav-menu">
        <Menu
          items={items}
          rootClassName="bg-transparent"
          mode="horizontal"
          style={{
            zIndex: 2, display: 'flex', justifyContent: 'center', height: 'min-content',
          }}
          onMouseLeave={() => setSubmenu(undefined)}
          subMenuCloseDelay={0.01}
          subMenuOpenDelay={0.2}
        />
      </div>
      <div className="nav-icons">
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
