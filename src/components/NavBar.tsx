import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { MouseEvent as ReactMouseEvent, useEffect, useState, useContext, useRef } from 'react';
import { SearchOutlined, HeartOutlined, ShoppingCartOutlined, DownOutlined, UpOutlined, CloseOutlined } from '@ant-design/icons';
import { AutoComplete, Badge, Button, Drawer, Input, Menu, Avatar, type MenuProps, type GetRef, Radio } from 'antd';
import { useSearchParams } from 'next/navigation';
import cn from 'classnames';

import { catalogPath, routes } from '@/routes';
import logoImage from '@/images/logo.svg';
import personIcon from '@/images/icons/person.svg';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { onFocus } from '@/utilities/onFocus';
import { SearchContext, MobileContext, NavbarContext, SubmitContext } from '@/components/Context';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { changeLang } from '@/slices/userSlice';

type NavigationKeys = {
  key: 'catalog' | 'about-brand' | 'delivery' | 'jewelry-care' | 'contacts' | 'home' | 'lang';
};

type MenuItem = Required<MenuProps>['items'][number] & NavigationKeys;

interface MobileNavBarInterface {
  searchClick: () => void;
  onChangeHandler: () => void;
  onOpenChange: (value: string[]) => void;
  items: MenuItem[];
  isMobile: boolean;
}

const LabelWithIcon = ({ label, href, isOpen }: { label: string; href?: string; isOpen: boolean; }) => href
  ? (
    <Link href={href} className="d-flex align-items-center gap-2">
      <span>{label}</span>
      {isOpen ? <UpOutlined /> : <DownOutlined />}
    </Link>
  )
  : <div className="d-flex align-items-center gap-2">
    <span>{label}</span>
    {isOpen ? <UpOutlined /> : <DownOutlined />}
  </div>;

const NavBarIcons = ({ searchClick, isMobile }: Pick<MobileNavBarInterface, 'searchClick' | 'isMobile'>) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });

  const { favorites, name } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);

  return (
    <div className="nav-icons" {...(isMobile ? {} : { 'data-aos': 'fade-down' })}>
      <Button className="icon-button not-hovered" title={t('search')} onClick={searchClick}>
        <SearchOutlined className="icon" />
        <span className="visually-hidden">{t('search')}</span>
      </Button>
      <Link href={routes.page.profile.favorites} title={t('favorites')}>
        <Badge count={favorites?.length} offset={[0, 23]}>
          <HeartOutlined className="icon" />
          <span className="visually-hidden">{t('favorites')}</span>
        </Badge>
      </Link>
      <Link href={routes.page.base.cartPage} title={t('cart')}>
        <Badge count={cart.reduce((acc, { count }) => acc + count, 0)} offset={[3, 23]}>
          <ShoppingCartOutlined className="icon" />
          <span className="visually-hidden">{t('cart')}</span>
        </Badge>
      </Link>
      <Link href={routes.page.profile.personalData} title={t('profile')}>
        {name
          ? (
            <Avatar style={{ backgroundColor: '#62c2d8ff', width: 28.8, height: 30, verticalAlign: 'middle' }}>
              {name[0]}
            </Avatar>
          )
          : <Image src={personIcon} unoptimized alt={t('logo')} />}
        <span className="visually-hidden">{t('profile')}</span>
      </Link>
    </div>
  );
};

const MobileNavBar = ({ searchClick, onOpenChange, onChangeHandler, isMobile, items }: MobileNavBarInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });

  const container = useRef<HTMLDivElement>(null);

  const { isActive } = useContext(NavbarContext);

  const [drawerContainer, setDrawerContainer] = useState<HTMLElement | null>(null);

  const navbarClassName = cn('menu-btn', { active: isActive });

  useEffect(() => {
    if (container?.current) {
      setDrawerContainer(container.current);
    }
  }, []);

  return (
    <div className="w-100" ref={container}>
      <div className="d-flex justify-content-between align-items-center">
        <NavBarIcons searchClick={searchClick} isMobile={isMobile} />
        <div className={navbarClassName} onClick={onChangeHandler} tabIndex={0} role="button" aria-label={t('title')} onKeyDown={() => undefined}>
          <span />
          <span />
          <span />
        </div>
      </div>
      {drawerContainer && (
        <Drawer
          title={<div className="text-center"><Image src={logoImage} priority unoptimized className="nav-logo" alt={t('logo')} /></div>}
          getContainer={() => drawerContainer}
          closeIcon={null}
          width="100%"
          open={isActive}
          zIndex={1500}
        >
          <Menu
            mode="inline"
            expandIcon={null}
            items={items}
            onOpenChange={onOpenChange}
            rootClassName="bg-transparent"
            motion={{
              motionName: 'ant-motion-collapse',
              onAppearStart: () => ({ height: 0 }),
              onAppearActive: (node) => ({ height: `${node.scrollHeight}px` }),
              onEnterStart: () => ({ height: 0 }),
              onEnterActive: (node) => ({ height: `${node.scrollHeight}px` }),
              onLeaveStart: () => ({ height: 0, transition: 'none' }),
              onLeaveActive: () => ({ height: 0, transition: 'none' }),
            }}
          />
        </Drawer>
      )}
    </div>
  );
};

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });

  const router = useRouter();
  const urlParams = useSearchParams();
  const dispatch = useAppDispatch();

  const { isSearch, setIsSearch } = useContext(SearchContext);
  const { isMobile } = useContext(MobileContext);
  const { isActive, setIsActive } = useContext(NavbarContext);
  const { setIsSubmit } = useContext(SubmitContext);

  const searchRef = useRef<GetRef<typeof AutoComplete>>(null);

  const searchParams = urlParams.get('search');

  const { token, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { itemGroups } = useAppSelector((state) => state.app);

  const [submenu, setSubmenu] = useState<NavigationKeys['key']>();
  const [navHeight, setNavHeight] = useState<string>(isMobile ? '' : '108px');
  const [search, setSearch] = useState<string | null>('');
  const [isOpen, setIsOpen] = useState(false);

  const onOpenChange = (value: string[]) => setIsOpen(!!value.length);

  const onTitleMouseEnter = ({ key }: any) => setSubmenu(key);

  const onTitleMouseLeave = ({ domEvent }: { domEvent: ReactMouseEvent<HTMLElement, MouseEvent> }) => {
    const target = domEvent.relatedTarget as Element;
    if (target?.classList?.contains('ant-menu-submenu-horizontal')) {
      setSubmenu(undefined);
    }
  };

  const onChangeHandler = () => {
    document.body.style.overflowY = !isActive ? 'hidden' : 'scroll';
    setIsActive(!isActive);
  };

  const changeLanguage = async (value: UserLangEnum) => {
    setIsSubmit(true);
    await dispatch(changeLang({ lang: value, token: !!token }));
    setIsSubmit(false);
  };

  const items: MenuItem[] = [
    ...(isMobile ? [{
      label: <Link href={routes.page.base.homePage}>{t('menu.home')}</Link>,
      key: 'home',
      onClick: onChangeHandler,
    } as MenuItem] : []),
    {
      label: <LabelWithIcon label={t('menu.catalog')} href={isMobile ? undefined : routes.page.base.catalog} isOpen={isMobile ? isOpen : submenu === 'catalog'} />,
      key: 'catalog',
      onTitleMouseEnter,
      onTitleMouseLeave,
      ...(isMobile ? { onClick: onChangeHandler } : {}),
      popupClassName: 'grid-submenu',
      children: [...(isMobile ? [{ code: '', order: -1, translations: [{ name: <span className="fw-bold">{t('menu.allItems')}</span>, lang: UserLangEnum.RU }, { name: <span className="fw-bold">{t('menu.allItems')}</span>, lang: UserLangEnum.EN }] }, ...itemGroups] : itemGroups)].sort((a, b) => a.order - b.order).map((itemGroup) => ({ label: <Link href={[catalogPath, itemGroup.code].join('/')}>{itemGroup.translations.find((translation) => translation.lang === lang)?.name}</Link>, className: 'navbar-padding', key: itemGroup.code, type: 'item' })),
    },
    {
      label: <Link href={routes.page.base.aboutBrandPage}>{t('menu.aboutBrand')}</Link>,
      ...(isMobile ? { onClick: onChangeHandler } : {}),
      ...(!isMobile && submenu === 'catalog' ? { style: { opacity: 0.5 } } : {}),
      key: 'about-brand',
    },
    {
      label: <Link href={routes.page.base.deliveryPage}>{t('menu.delivery')}</Link>,
      ...(isMobile ? { onClick: onChangeHandler } : {}),
      ...(!isMobile && submenu === 'catalog' ? { style: { opacity: 0.5 } } : {}),
      key: 'delivery',
    },
    {
      label: <Link href={routes.page.base.jewelryCarePage}>{t('menu.jewelryCaring')}</Link>,
      ...(isMobile ? { onClick: onChangeHandler } : {}),
      ...(!isMobile && submenu === 'catalog' ? { style: { opacity: 0.5 } } : {}),
      key: 'jewelry-care',
    },
    {
      label: <Link href={routes.page.base.contactsPage}>{t('menu.contacts')}</Link>,
      ...(isMobile ? { onClick: onChangeHandler } : {}),
      ...(!isMobile && submenu === 'catalog' ? { style: { opacity: 0.5 } } : {}),
      key: 'contacts',
    },
    ...(isMobile ? [{
      label: (
        <Radio.Group className="nav-lang" value={lang} onChange={({ target }) => changeLanguage(target.value)} size="small">
          {Object.values(UserLangEnum).map((language) => <Radio.Button key={language} value={language}>{language}</Radio.Button>)}
        </Radio.Group>
      ),
      key: 'lang',
    } as MenuItem] : []),
  ];

  const onSearch = async () => {
    const newQuery = { ...router.query };
    if (!search) {
      delete newQuery.search;
      setIsSearch({ value: false, needFetch: true });
    }
    if (newQuery.path) {
      delete newQuery.path;
    }
    router.push({ query: search ? { search } : newQuery, pathname: routes.page.base.catalog });
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
      const newQuery = { ...router.query };
      delete newQuery.search;
      router.push({ query: newQuery }, undefined, { shallow: true });
    }
  };

  useEffect(() => {
    if (isSearch?.value && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearch?.value]);

  useEffect(() => {
    const defaultHeight = isMobile ? 60 : 108;

    if (!isMobile) {
      if (!submenu) {
        setNavHeight(`${defaultHeight}px`);
      } else if (submenu === 'catalog') {
        setNavHeight(`${(itemGroups.length > 6 ? 6 : itemGroups.length) * 43 + defaultHeight}px`);
      }
    } else {
      setNavHeight('');
    }
  }, [submenu, isMobile]);

  useEffect(() => {
    setSearch(searchParams);
  }, [searchParams]);

  return (
    <nav className="nav" {...(navHeight ? { style: { height: navHeight } } : {})}>
      {isMobile
        ? (
          <>
            <MobileNavBar searchClick={searchClick} onOpenChange={onOpenChange} onChangeHandler={onChangeHandler} isMobile={isMobile} items={items} />
            {isSearch?.value
              ? (
                <div className="mt-4 d-flex justify-content-center align-items-center gap-3 w-100 animate__animated animate__fadeInDown">
                  <CloseOutlined onClick={() => setIsSearch({ value: false, needFetch: false })} />
                  <AutoComplete
                    ref={searchRef}
                    className="custom-placeholder w-100"
                    style={{ height: 'auto' }}
                    value={search}
                    onChange={setSearch}
                    onInputKeyDown={onKeyboardSearch}
                  >
                    <Input.Search size="large" placeholder={t('search')} onSearch={onSearch} enterButton />
                  </AutoComplete>
                </div>
              ) : null}
          </>
        )
        : (
          <>
            <Radio.Group className="nav-lang" value={lang} onChange={({ target }) => changeLanguage(target.value)} size="small">
              {Object.values(UserLangEnum).map((language) => <Radio.Button key={language} value={language}>{language}</Radio.Button>)}
            </Radio.Group>
            <div className="nav-logo-container" {...(isMobile ? {} : { 'data-aos': 'fade-down' })}>
              <Link href={routes.page.base.homePage}>
                <Image src={logoImage} priority unoptimized className="nav-logo" alt={t('logo')} />
              </Link>
            </div>
            {isSearch?.value
              ? (
                <div className="d-flex justify-content-center align-items-center animate__animated animate__fadeInDown gap-3" style={{ width: '60%' }}>
                  <CloseOutlined onClick={() => setIsSearch({ value: false, needFetch: false })} />
                  <AutoComplete
                    ref={searchRef}
                    className="custom-placeholder"
                    style={{ width: '80%', height: 'auto' }}
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
                    {...(isMobile ? {} : { 'data-aos': 'fade-down' })}
                    items={items}
                    selectedKeys={[router.asPath.split('/')[1]]}
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
            <NavBarIcons searchClick={searchClick} isMobile={isMobile} />
          </>
        )}
    </nav>
  );
};
