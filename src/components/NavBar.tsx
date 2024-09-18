/* eslint-disable @typescript-eslint/no-explicit-any */
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/utilities/hooks';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MouseEvent as ReactMouseEvent, useEffect, useState } from 'react';
import {
  SearchOutlined, HeartOutlined, ShoppingCartOutlined, DownOutlined,
} from '@ant-design/icons';
import routes from '@/routes';
import logo from '@/images/logo.svg';
import person from '@/images/icons/person.svg';
import { Menu, type MenuProps } from 'antd';

type NavigationKeys = {
  key: 'catalog' | 'aboutBrand' | 'delivery' | 'jewelryCaring' | 'contacts';
};

type MenuItem = Required<MenuProps>['items'][number] & NavigationKeys;

const LabelWithIcon = ({ label }: { label: string }) => (
  <div className="d-flex align-items-center gap-2">
    <span>{label}</span>
    <DownOutlined />
  </div>
);

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
      label: <LabelWithIcon label={t('menu.catalog.title')} />,
      key: 'catalog',
      onTitleClick: () => router.push(routes.homePage),
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: [
        { label: t('menu.catalog.necklace'), key: 'necklace' },
        { label: t('menu.catalog.bracelets'), key: 'bracelets' },
        { label: t('menu.catalog.earrings'), key: 'earrings' },
        { label: t('menu.catalog.accessories'), key: 'accessories' },
      ],
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

  useEffect(() => {
    if (!submenu) {
      setNavHeight('7vw');
    } else if (submenu === 'catalog') {
      setNavHeight('19vw');
    }
  }, [submenu]);

  return (
    <nav className="nav" style={{ height: navHeight }}>
      <div className="nav-logo-container" data-aos="fade-down">
        <Image src={logo} className="nav-logo" alt={t('logo')} priority role="button" onClick={() => router.push(routes.homePage)} />
      </div>
      <div className="nav-menu" data-aos="fade-down">
        <Menu
          items={items}
          rootClassName="bg-transparent"
          mode="horizontal"
          style={{
            zIndex: 2, display: 'flex', justifyContent: 'center', height: 'min-content',
          }}
          onMouseLeave={() => setSubmenu(undefined)}
          subMenuCloseDelay={0.0000000001}
          subMenuOpenDelay={0.3}
        />
      </div>
      <div className="nav-icons" data-aos="fade-down">
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
