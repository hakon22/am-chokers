import { useContext, useRef, useState, useEffect, type MouseEvent as ReactMouseEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
  SearchOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  CloseOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import {
  AutoComplete, Badge, Button, Drawer, Input, Menu, Avatar, Radio, type MenuProps, type GetRef,
} from 'antd';
import cn from 'classnames';

import { catalogPath, routes } from '@/routes';
import logoImage from '@/images/logo.svg';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { onFocus } from '@/utilities/onFocus';
import { SearchContext, MobileContext, NavbarContext, SubmitContext, AuthModalContext } from '@/components/Context';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { changeLang } from '@/slices/userSlice';
import styles from '@/themes/v2/components/NavBar.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';

type NavigationKeys = {
  key: 'catalog' | 'about-brand' | 'delivery' | 'jewelry-care' | 'contacts' | 'home' | 'lang';
};

type MenuItem = Required<MenuProps>['items'][number] & NavigationKeys;

const LabelWithIcon = ({ label, href, isOpen }: { label: string; href?: string; isOpen: boolean; }) => href
  ? (
    <Link href={href} className="d-flex align-items-center gap-1">
      <span>{label}</span>
      {isOpen ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
    </Link>
  )
  : (
    <div className="d-flex align-items-center gap-1">
      <span>{label}</span>
      {isOpen ? <UpOutlined style={{ fontSize: 10 }} /> : <DownOutlined style={{ fontSize: 10 }} />}
    </div>
  );

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const router = useRouter();
  const urlParams = useSearchParams();
  const dispatch = useAppDispatch();

  const { isSearch, setIsSearch } = useContext(SearchContext);
  const { isMobile } = useContext(MobileContext);
  const { isActive, setIsActive } = useContext(NavbarContext);
  const { setIsSubmit } = useContext(SubmitContext);
  const { openAuthModal } = useContext(AuthModalContext);

  const searchRef = useRef<GetRef<typeof AutoComplete>>(null);
  const searchParams = urlParams.get('search');

  const { token, lang = UserLangEnum.RU, name, favorites } = useAppSelector((state) => state.user);
  const { itemGroups } = useAppSelector((state) => state.app);
  const { cart } = useAppSelector((state) => state.cart);

  const cartCount = cart.reduce((acc, { count }) => acc + count, 0);
  const favCount = favorites?.length ?? 0;

  const [submenu, setSubmenu] = useState<NavigationKeys['key']>();
  const [navHeight, setNavHeight] = useState('100px');
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

  const catalogChildren = [...(isMobile
    ? [{ code: '', order: -1, translations: [{ name: <span className="fw-bold">{t('menu.allItems')}</span>, lang: UserLangEnum.RU }, { name: <span className="fw-bold">{t('menu.allItems')}</span>, lang: UserLangEnum.EN }] }, ...itemGroups]
    : itemGroups),
  ].sort((a, b) => a.order - b.order).flatMap((itemGroup) => [
    {
      label: <Link href={[catalogPath, itemGroup.code].join('/')}>{itemGroup.translations.find((translation) => translation.lang === lang)?.name}</Link>,
      className: 'navbar-padding',
      key: itemGroup.code,
      type: 'item' as const,
    },
    ...(isMobile && itemGroup.code === '' ? [{ type: 'divider' as const, key: 'all-items-divider' }] : []),
  ]);

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
      children: catalogChildren,
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
    if (key === 'Enter') onSearch();
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
    if (!isMobile) {
      setNavHeight(submenu === 'catalog'
        ? `${(itemGroups.length > 6 ? 6 : itemGroups.length) * 43 + 100}px`
        : '100px');
    }
  }, [submenu, isMobile, itemGroups.length]);

  useEffect(() => {
    if (isSearch?.value && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isSearch?.value]);

  useEffect(() => {
    setSearch(searchParams);
  }, [searchParams]);

  // ── Desktop ──
  const desktopNav = (
    <nav className={styles.nav} style={{ height: navHeight }}>
      <div className={styles.navBar}>
        {/* Top-center — lang switcher (absolute, like v1) */}
        <Radio.Group className={styles.langGroup} value={lang} onChange={({ target }) => changeLanguage(target.value)} size="small">
          {Object.values(UserLangEnum).map((language) => (
            <Radio.Button key={language} value={language}>{language}</Radio.Button>
          ))}
        </Radio.Group>

        {/* Left — logo */}
        <div className={styles.navLeft}>
          <Link href={routes.page.base.homePage} className={styles.navLogo}>
            <V2Image src={logoImage} priority unoptimized className={styles.logoImg} alt={t('logo')} />
          </Link>
        </div>

        {/* Center — menu or search */}
        <div className={styles.navCenter}>
          {isSearch?.value
            ? (
              <div className={styles.searchBar}>
                <CloseOutlined
                  style={{ color: '#69788E', cursor: 'pointer', fontSize: 16 }}
                  onClick={() => setIsSearch({ value: false, needFetch: false })}
                />
                <AutoComplete
                  ref={searchRef}
                  className={cn('custom-placeholder', styles.navSearchAutocomplete)}
                  style={{ flex: 1, height: 'auto' }}
                  value={search}
                  onChange={setSearch}
                  onInputKeyDown={onKeyboardSearch}
                >
                  <Input.Search size="middle" placeholder={t('search')} onSearch={onSearch} enterButton />
                </AutoComplete>
              </div>
            )
            : (
              <Menu
                items={items}
                selectedKeys={[router.asPath.split('/')[1]]}
                rootClassName="bg-transparent"
                mode="horizontal"
                style={{ zIndex: 2, border: 'none', background: 'transparent', justifyContent: 'center' }}
                onMouseLeave={() => setSubmenu(undefined)}
                subMenuCloseDelay={0.0000000001}
                subMenuOpenDelay={0.05}
              />
            )}
        </div>

        {/* Right — icons */}
        <div className={styles.navRight}>
          <Button className={styles.iconBtn} title={t('search')} onClick={searchClick}>
            <SearchOutlined />
          </Button>
          {token ? (
            <Link href={routes.page.profile.favorites} title={t('favorites')}>
              <Button className={styles.iconBtn}>
                <Badge count={favCount} offset={[4, -3]} size="small">
                  <HeartOutlined />
                </Badge>
              </Button>
            </Link>
          ) : (
            <Button className={styles.iconBtn} title={t('favorites')} onClick={() => openAuthModal?.('login')}>
              <HeartOutlined />
            </Button>
          )}
          <Link href={routes.page.base.cartPage} title={t('cart')}>
            <Button className={styles.iconBtn}>
              <Badge count={cartCount} offset={[4, -3]} size="small">
                <ShoppingCartOutlined />
              </Badge>
            </Button>
          </Link>
          {token ? (
            <Link href={routes.page.profile.personalData} title={t('profile')}>
              <Button className={styles.iconBtn}>
                <Avatar style={{ backgroundColor: '#2B3C5F', width: 26, height: 26 }}>{name![0]}</Avatar>
              </Button>
            </Link>
          ) : (
            <Button className={styles.iconBtn} title={t('profile')} onClick={() => openAuthModal?.('login')}>
              <UserOutlined />
            </Button>
          )}
        </div>
      </div>
    </nav>
  );

  // ── Mobile (логика от v1, контент от v2) ──
  const mobileContainer = useRef<HTMLDivElement>(null);
  const [mobileDrawerContainer, setMobileDrawerContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (mobileContainer.current) {
      setMobileDrawerContainer(mobileContainer.current);
    }
  }, []);

  const mobileNav = (
    <div className={styles.mobileHeader} ref={mobileContainer}>
      <div className={styles.mobileHeaderRow}>
        <Link href={routes.page.base.homePage} className={styles.mobileLogo}>
          <V2Image src={logoImage} priority unoptimized className={styles.mobileLogoImg} alt={t('logo')} />
        </Link>
        <div className={styles.mobileRight}>
          {isSearch?.value
            ? (
              <Button className={styles.iconBtn} onClick={() => setIsSearch({ value: false, needFetch: false })}>
                <CloseOutlined />
              </Button>
            )
            : (
              <Button className={styles.iconBtn} onClick={searchClick}>
                <SearchOutlined />
              </Button>
            )}
          <div className={cn('menu-btn', { active: isActive })} onClick={onChangeHandler} role="button" tabIndex={0} aria-label={t('title')} onKeyDown={() => undefined}>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      {isSearch?.value && (
        <div className={styles.mobileSearchRow}>
          <AutoComplete
            ref={searchRef}
            className={cn('custom-placeholder', 'w-100', styles.navSearchAutocomplete)}
            style={{ height: 'auto', width: '100%' }}
            value={search}
            onChange={setSearch}
            onInputKeyDown={onKeyboardSearch}
          >
            <Input.Search size="large" placeholder={t('search')} onSearch={onSearch} enterButton />
          </AutoComplete>
        </div>
      )}
      {mobileDrawerContainer && (
        <Drawer
          title={
            <Link href={routes.page.base.homePage} onClick={onChangeHandler}>
              <V2Image src={logoImage} priority unoptimized className={styles.drawerLogo} alt={t('logo')} />
            </Link>
          }
          getContainer={() => mobileDrawerContainer}
          closeIcon={null}
          width="100%"
          open={isActive}
          zIndex={1500}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="inline"
            expandIcon={null}
            className={styles.drawerMenu}
            items={[...items, {
              label: (
                <div className={styles.drawerLang}>
                  {Object.values(UserLangEnum).map((language) => (
                    <Radio.Button
                      key={language}
                      className={cn({ [styles.activeLang]: lang === language })}
                      onClick={() => changeLanguage(language)}
                    >
                      {language}
                    </Radio.Button>
                  ))}
                </div>
              ),
              key: 'lang',
            } as MenuItem]}
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

  return isMobile ? mobileNav : desktopNav;
};
