import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MouseEvent as ReactMouseEvent, useEffect, useState, useContext } from 'react';
import {
  SearchOutlined, HeartOutlined, ShoppingCartOutlined, DownOutlined,
} from '@ant-design/icons';
import { AutoComplete, Badge, Button, Input, Menu, type MenuProps } from 'antd';
import { useSearchParams } from 'next/navigation';

import { catalogPath, routes } from '@/routes';
import logoImage from '@/images/logo.svg';
import personIcon from '@/images/icons/person.svg';
import { useAppSelector } from '@/utilities/hooks';
import { onFocus } from '@/utilities/onFocus';
import { SearchContext } from '@/components/Context';

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

  const router = useRouter();
  const urlParams = useSearchParams();

  const { isSearch, setIsSearch } = useContext(SearchContext);

  const searchParams = urlParams.get('search');

  const { itemGroups } = useAppSelector((state) => state.app);
  const { favorites } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);

  const defaultHeight = 108;

  const [submenu, setSubmenu] = useState<NavigationKeys['key']>();
  const [navHeight, setNavHeight] = useState<string>(`${defaultHeight}px`);
  const [isLoaded, setIsLoaded] = useState(false);
  const [search, setSearch] = useState<string | null>('');

  const onTitleMouseEnter = ({ key }: any) => setSubmenu(key);

  const onTitleMouseLeave = ({ domEvent }: { domEvent: ReactMouseEvent<HTMLElement, MouseEvent> }) => {
    const target = domEvent.relatedTarget as Element;
    if (target?.classList?.contains('ant-menu-submenu-horizontal')) {
      setSubmenu(undefined);
    }
  };

  const items: MenuItem[] = [
    {
      label: <LabelWithIcon label={t('menu.catalog')} href={routes.catalog} />,
      key: 'catalog',
      onTitleMouseEnter,
      onTitleMouseLeave,
      children: itemGroups.map((itemGroup) => ({ label: <Link href={[catalogPath, itemGroup.code].join('/')}>{itemGroup.name}</Link>, className: 'navbar-padding', key: itemGroup.code })),
    },
    {
      label: <Link href={routes.aboutBrandPage}>{t('menu.aboutBrand')}</Link>,
      key: 'aboutBrand',
    },
    {
      label: <Link href={routes.deliveryPage}>{t('menu.delivery')}</Link>,
      key: 'delivery',
    },
    {
      label: <Link href={routes.jewelryCarePage}>{t('menu.jewelryCaring')}</Link>,
      key: 'jewelryCaring',
    },
    {
      label: <Link href={routes.contactsPage}>{t('menu.contacts')}</Link>,
      key: 'contacts',
    },
  ];

  const onSearch = async () => {
    if (!search) {
      delete router.query.search;
      setIsSearch({ value: false, needFetch: true });
    }
    if (router.query?.path) {
      delete router.query.path;
    }
    router.push({ query: search ? { ...router.query, search } : router.query, pathname: routes.catalog });
    onFocus();
  };

  const onKeyboardSearch = ({ key }: { key: string; }) => {
    if (key === 'Enter') {
      onSearch();
    }
  };

  const searchClick = () => {
    setIsSearch({ value: !isSearch?.value, needFetch: isSearch?.value ? true : false });
    if (isSearch?.value) {
      setSearch('');
      delete router.query.search;
      router.push({ query: router.query }, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (!submenu) {
      setNavHeight(`${defaultHeight}px`);
    } else if (submenu === 'catalog') {
      setNavHeight(`${itemGroups.length * 42 + defaultHeight}px`);
    }
  }, [submenu]);

  useEffect(() => {
    setSearch(searchParams);
  }, [searchParams]);

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <nav className="nav" style={{ height: navHeight }}>
      {isLoaded && (
        <>
          <div className="nav-logo-container" data-aos="fade-down">
            <Link href={routes.homePage}>
              <Image src={logoImage} priority unoptimized className="nav-logo" alt={t('logo')} />
            </Link>
          </div>
          {isSearch?.value
            ? (
              <div className="d-flex justify-content-center align-items-center" style={{ width: '60%' }}>
                <AutoComplete
                  className="custom-placeholder animate__animated animate__fadeInDown"
                  style={{ width: '80%' }}
                  value={search}
                  onChange={setSearch}
                  onInputKeyDown={onKeyboardSearch}
                >
                  <Input.Search size="large" placeholder={t('search')} onSearch={onSearch} enterButton />
                </AutoComplete>
              </div>
            )
            : (
              <div className="nav-menu">
                <Menu
                  data-aos="fade-down"
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
            )}
          <div className="nav-icons" data-aos="fade-down">
            <Button className="icon-button not-hovered" title={t('search')} onClick={searchClick}>
              <SearchOutlined className="icon" />
              <span className="visually-hidden">{t('search')}</span>
            </Button>
            <Link href={routes.favorites} title={t('favorites')}>
              <Badge count={favorites?.length} offset={[3, 23]}>
                <HeartOutlined className="icon" />
                <span className="visually-hidden">{t('favorites')}</span>
              </Badge>
            </Link>
            <Link href={routes.cartPage} title={t('cart')}>
              <Badge count={cart.reduce((acc, { count }) => acc + count, 0)} offset={[3, 23]}>
                <ShoppingCartOutlined className="icon" />
                <span className="visually-hidden">{t('cart')}</span>
              </Badge>
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
