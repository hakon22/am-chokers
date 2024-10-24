import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { MouseEvent as ReactMouseEvent, useEffect, useState } from 'react';
import {
  SearchOutlined, HeartOutlined, ShoppingCartOutlined, DownOutlined,
} from '@ant-design/icons';
import { routes } from '@/routes';
import logoImage from '@/images/logo.svg';
import personIcon from '@/images/icons/person.svg';
import { Menu, type MenuProps } from 'antd';

type NavigationKeys = {
  key: 'catalog' | 'aboutBrand' | 'delivery' | 'jewelryCaring' | 'contacts';
};

type MenuItem = Required<MenuProps>['items'][number] & NavigationKeys;

const LabelWithIcon = ({ label, href }: { label: string, href: string }) => (
  <Link href={href} className="d-flex align-items-center gap-2">
    <span>{label}</span>
    <DownOutlined />
  </Link>
);

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });

  const [submenu, setSubmenu] = useState<NavigationKeys['key']>();
  const [navHeight, setNavHeight] = useState<string>('108px');
  const [isLoaded, setIsLoaded] = useState(false);

  const onTitleMouseEnter = ({ key }: any) => setSubmenu(key);

  const onTitleMouseLeave = ({ domEvent }: { domEvent: ReactMouseEvent<HTMLElement, MouseEvent> }) => {
    const target = domEvent.relatedTarget as Element;
    if (target?.classList?.contains('ant-menu-submenu-horizontal')) {
      setSubmenu(undefined);
    }
  };

  const items: MenuItem[] = [
    {
      label: <LabelWithIcon label={t('menu.catalog.title')} href={routes.catalog} />,
      key: 'catalog',
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: [
        { label: <Link href={routes.necklace}>{t('menu.catalog.necklace')}</Link>, key: 'necklace' },
        { label: <Link href={routes.bracelets}>{t('menu.catalog.bracelets')}</Link>, key: 'bracelets' },
        { label: <Link href={routes.earrings}>{t('menu.catalog.earrings')}</Link>, key: 'earrings' },
        { label: <Link href={routes.accessories}>{t('menu.catalog.accessories')}</Link>, key: 'accessories' },
      ],
    },
    {
      label: <Link href="/">{t('menu.aboutBrand')}</Link>,
      key: 'aboutBrand',
    },
    {
      label: <Link href="/">{t('menu.delivery')}</Link>,
      key: 'delivery',
    },
    {
      label: <Link href="/">{t('menu.jewelryCaring')}</Link>,
      key: 'jewelryCaring',
    },
    {
      label: <Link href="/">{t('menu.contacts')}</Link>,
      key: 'contacts',
    },
  ];

  useEffect(() => {
    if (!submenu) {
      setNavHeight('108px');
    } else if (submenu === 'catalog') {
      setNavHeight('275px');
    }
  }, [submenu]);

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <nav className="nav" style={{ height: navHeight }}>
      {isLoaded && (
        <>
          <div className="nav-logo-container" data-aos="fade-down">
            <Link href="/">
              <Image src={logoImage} unoptimized className="nav-logo" alt={t('logo')} />
            </Link>
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
            <Link href="/" title={t('search')}>
              <SearchOutlined className="icon" />
              <span className="visually-hidden">{t('search')}</span>
            </Link>
            <Link href="/" title={t('favorites')}>
              <HeartOutlined className="icon" />
              <span className="visually-hidden">{t('favorites')}</span>
            </Link>
            <Link href="/" title={t('cart')}>
              <ShoppingCartOutlined className="icon" />
              <span className="visually-hidden">{t('cart')}</span>
            </Link>
            <Link href={routes.profilePage} title={t('profile')}>
              <Image src={personIcon} unoptimized alt={t('logo')} />
              <span className="visually-hidden">{t('profile')}</span>
            </Link>
          </div>
        </>
      )}
    </nav>
  );
};
