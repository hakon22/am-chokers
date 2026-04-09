import { useContext, useEffect, useState, type JSX } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import {
  UserOutlined,
  ShoppingOutlined,
  HeartOutlined,
  StarOutlined,
  LogoutOutlined,
  DownOutlined,
  CrownOutlined,
} from '@ant-design/icons';
import cn from 'classnames';

import { routes } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { AuthContext, AuthModalContext } from '@/components/Context';
import { Helmet } from '@/components/Helmet';
import { V2Personal } from '@/themes/v2/components/profile/V2Personal';
import { V2OrderHistory } from '@/themes/v2/components/profile/V2OrderHistory';
import { V2Order } from '@/themes/v2/components/profile/V2Order';
import { V2Favorites } from '@/themes/v2/components/profile/V2Favorites';
import { V2Reviews } from '@/themes/v2/components/profile/V2Reviews';
import { V2AdminSettings } from '@/themes/v2/components/profile/V2AdminSettings';
import styles from '@/themes/v2/components/profile/V2ProfilePage.module.scss';

type Props = { path: string[]; };

const pages: Record<string, JSX.Element> = {
  personal:      <V2Personal />,
  orders:        <V2OrderHistory />,
  favorites:     <V2Favorites />,
  reviews:       <V2Reviews />,
  adminSettings: <V2AdminSettings />,
};

const getPage = (path: string[]) => {
  if (path[0] === 'orders' && path.length > 1) return <V2Order orderId={+path[1]} />;
  return pages[path[0]] ?? <V2Personal />;
};

// ── No-auth screen ────────────────────────────────────────────────
const NoAuthScreen = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const { openAuthModal } = useContext(AuthModalContext);

  const handleLogin = (e: React.MouseEvent) => {
    if (openAuthModal) { e.preventDefault(); openAuthModal('login'); }
  };
  const handleSignup = (e: React.MouseEvent) => {
    if (openAuthModal) { e.preventDefault(); openAuthModal('signup'); }
  };

  return (
    <div className={styles.noAuth}>
      <div className={styles.noAuthIcon}><UserOutlined /></div>
      <h2 className={styles.noAuthTitle}>{t('title')}</h2>
      <p className={styles.noAuthText}>{t('entrace1')}</p>
      <div className={styles.noAuthActions}>
        <a href={routes.page.base.loginPage} className={styles.btnPrimary} onClick={handleLogin}>
          {t('entrace')}
        </a>
        <a href={routes.page.base.signupPage} className={styles.btnOutline} onClick={handleSignup}>
          {t('signup')}
        </a>
      </div>
    </div>
  );
};

// ── Sidebar nav item ──────────────────────────────────────────────
const NavItem = ({ href, icon, label, badge, active }: {
  href: string;
  icon: JSX.Element;
  label: string;
  badge?: number;
  active: boolean;
}) => (
  <Link href={href} className={cn(styles.navItem, { [styles.active]: active })}>
    <span className={styles.navIcon}>{icon}</span>
    {label}
    {!!badge && <span className={styles.navBadge}>{badge}</span>}
  </Link>
);

// ── Admin bottom sheet (mobile) ───────────────────────────────────
const AdminBottomSheet = ({ t, open, onClose }: { t: (key: string) => string; open: boolean; onClose: () => void; }) => {
  const router = useRouter();

  const adminLinks = [
    { label: t('menu.admin.items.deferredPublication'), href: routes.page.admin.deferredPublication },
    { label: t('menu.admin.items.newItem'),             href: routes.page.admin.newItem },
    { label: t('menu.admin.items.itemGroups'),          href: routes.page.admin.itemGroupsControl },
    { label: t('menu.admin.items.itemCollections'),     href: routes.page.admin.itemCollectionsControl },
    { label: t('menu.admin.items.itemList'),            href: routes.page.admin.itemList },
  ];

  const reportLinks = [
    { label: t('menu.admin.reports.users'),   href: routes.page.admin.userList },
    { label: t('menu.admin.reports.cart'),    href: routes.page.admin.cartReport },
    { label: t('menu.admin.reports.message'), href: routes.page.admin.messageReport },
    { label: t('menu.admin.reports.metrica'), href: routes.page.admin.metricaReport },
  ];

  const otherLinks = [
    { label: t('menu.admin.orders'),             href: routes.page.admin.allOrders },
    { label: t('menu.admin.moderationOfReview'), href: routes.page.admin.moderationOfReview },
    { label: t('menu.admin.promotionalCodes'),   href: routes.page.admin.promotionalCodes },
    { label: t('menu.admin.compositions'),       href: routes.page.admin.compositionsControl },
    { label: t('menu.admin.colors'),             href: routes.page.admin.colorsControl },
    { label: t('menu.admin.banners'),            href: routes.page.admin.banners },
    { label: t('menu.admin.adminSettings'),      href: routes.page.admin.adminSettings },
  ];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className={styles.sheetOverlay} onClick={onClose} />
      <div className={styles.sheet}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <span><CrownOutlined style={{ marginRight: 8 }} />{t('menu.admin.title')}</span>
          <button className={styles.sheetClose} type="button" onClick={onClose}>✕</button>
        </div>
        <div className={styles.sheetBody}>
          <span className={styles.adminSubTitle}>{t('menu.admin.items.title')}</span>
          {adminLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.sheetLink, { [styles.active]: router.asPath === href })} onClick={onClose}>
              {label}
            </Link>
          ))}

          <span className={styles.adminSubTitle}>{t('menu.admin.reports.title')}</span>
          {reportLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.sheetLink, { [styles.active]: router.asPath === href })} onClick={onClose}>
              {label}
            </Link>
          ))}

          <div className={styles.sheetDivider} />
          {otherLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.sheetLink, { [styles.active]: router.asPath === href })} onClick={onClose}>
              {label}
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Admin sub-section ─────────────────────────────────────────────
const AdminSection = ({ t }: { t: (key: string) => string; }) => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const adminLinks = [
    { label: t('menu.admin.items.deferredPublication'), href: routes.page.admin.deferredPublication },
    { label: t('menu.admin.items.newItem'),             href: routes.page.admin.newItem },
    { label: t('menu.admin.items.itemGroups'),          href: routes.page.admin.itemGroupsControl },
    { label: t('menu.admin.items.itemCollections'),     href: routes.page.admin.itemCollectionsControl },
    { label: t('menu.admin.items.itemList'),            href: routes.page.admin.itemList },
  ];

  const reportLinks = [
    { label: t('menu.admin.reports.users'),   href: routes.page.admin.userList },
    { label: t('menu.admin.reports.cart'),    href: routes.page.admin.cartReport },
    { label: t('menu.admin.reports.message'), href: routes.page.admin.messageReport },
    { label: t('menu.admin.reports.metrica'), href: routes.page.admin.metricaReport },
  ];

  const otherLinks = [
    { label: t('menu.admin.orders'),             href: routes.page.admin.allOrders },
    { label: t('menu.admin.moderationOfReview'), href: routes.page.admin.moderationOfReview },
    { label: t('menu.admin.promotionalCodes'),   href: routes.page.admin.promotionalCodes },
    { label: t('menu.admin.compositions'),       href: routes.page.admin.compositionsControl },
    { label: t('menu.admin.colors'),             href: routes.page.admin.colorsControl },
    { label: t('menu.admin.banners'),            href: routes.page.admin.banners },
    { label: t('menu.admin.adminSettings'),      href: routes.page.admin.adminSettings },
  ];

  return (
    <div className={styles.adminSection}>
      <div
        className={styles.adminHeader}
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={({ key }) => key === 'Enter' && setOpen(!open)}
      >
        <span><CrownOutlined style={{ marginRight: 6 }} />{t('menu.admin.title')}</span>
        <DownOutlined className={cn(styles.adminChevron, { [styles.open]: open })} />
      </div>

      {open && (
        <div className={styles.adminLinks}>
          <span className={styles.adminSubTitle}>{t('menu.admin.items.title')}</span>
          {adminLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.adminLink, { [styles.active]: router.asPath === href })}>
              {label}
            </Link>
          ))}

          <span className={styles.adminSubTitle}>{t('menu.admin.reports.title')}</span>
          {reportLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.adminLink, { [styles.active]: router.asPath === href })}>
              {label}
            </Link>
          ))}

          {otherLinks.map(({ label, href }) => (
            <Link key={href} href={href} className={cn(styles.adminLink, { [styles.active]: router.asPath === href })}>
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────
export const V2ProfilePage = ({ path }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile' });
  const router = useRouter();

  const { logOut } = useContext(AuthContext);

  const { id, isAdmin, name, favorites } = useAppSelector((state) => state.user);
  const { pagination } = useAppSelector((state) => state.app);

  const [adminSheetOpen, setAdminSheetOpen] = useState(false);

  const titleProps = {
    id: path[1],
    ...(routes.page.profile.favorites === router.asPath ? { count: favorites?.length } : {}),
    ...(routes.page.profile.myReviews === router.asPath ? { count: pagination.count } : {}),
  };

  const activeKey = path[1] ? 'orders' : path[0];

  const navItems = [
    { key: 'personal',  href: routes.page.profile.personalData,  icon: <UserOutlined />,     label: t('menu.personal') },
    { key: 'orders',    href: routes.page.profile.orderHistory,   icon: <ShoppingOutlined />,  label: t('menu.orders') },
    { key: 'favorites', href: routes.page.profile.favorites,     icon: <HeartOutlined />,     label: t('menu.favorites'), badge: favorites?.length },
    { key: 'reviews',   href: routes.page.profile.myReviews,     icon: <StarOutlined />,      label: t('menu.reviews') },
  ];

  const pageKey = path.length === 1 ? path[0] : `${path[0]}.order`;
  const pageTitle = String(t(`${pageKey}.title` as any, titleProps as any));
  const pageDescription = String(t(`${pageKey}.description` as any, titleProps as any));

  return (
    <>
      <Helmet title={pageTitle} description={pageDescription} />

      {!id ? (
        <NoAuthScreen />
      ) : (
        <div className={styles.shell}>
          {/* ── Mobile: user bar (CSS-only visible on mobile) ─────── */}
          <div className={styles.mobileUserBar}>
            <div className={styles.mobileAvatar}>{name?.[0]?.toUpperCase()}</div>
            <span className={styles.mobileUserName}>{name}</span>
            <button className={styles.mobileLogout} type="button" onClick={logOut}>
              {t('menu.logout')}
            </button>
          </div>

          {/* ── Mobile: horizontal tab bar ────────────────────────── */}
          <div className={styles.mobileTabs}>
            <div className={styles.mobileTabsInner}>
              {navItems.map(({ key, href, icon, label }) => (
                <Link key={key} href={href} className={cn(styles.mobileTab, { [styles.active]: activeKey === key })}>
                  <span className={styles.mobileTabIcon}>{icon}</span>
                  {label}
                </Link>
              ))}
              {isAdmin && (
                <button
                  type="button"
                  className={cn(styles.mobileTab, styles.mobileTabBtn, { [styles.active]: adminSheetOpen })}
                  onClick={() => setAdminSheetOpen(true)}
                >
                  <span className={styles.mobileTabIcon}><CrownOutlined /></span>
                  {t('menu.admin.title')}
                </button>
              )}
            </div>
          </div>

          {/* ── Desktop + Tablet: sidebar + content grid ──────────── */}
          <div className={styles.page}>
            <aside className={styles.sidebar}>
              <div className={styles.avatarBlock}>
                <div className={styles.avatar}>{name?.[0]?.toUpperCase()}</div>
                <span className={styles.userName}>{name}</span>
              </div>

              <nav className={styles.nav}>
                {navItems.map(({ key, href, icon, label, badge }) => (
                  <NavItem
                    key={key}
                    href={href}
                    icon={icon}
                    label={label}
                    badge={badge}
                    active={activeKey === key}
                  />
                ))}
              </nav>

              {isAdmin && <AdminSection t={t} />}

              <div className={styles.logoutSection}>
                <button className={styles.logoutBtn} type="button" onClick={logOut}>
                  <span className={styles.navIcon}><LogoutOutlined /></span>
                  {t('menu.logout')}
                </button>
              </div>
            </aside>

            {/* Content is shared: visible on both desktop and mobile */}
            <main className={styles.content}>
              {getPage(path)}
            </main>
          </div>
        </div>
      )}

      {isAdmin && <AdminBottomSheet t={t} open={adminSheetOpen} onClose={() => setAdminSheetOpen(false)} />}
    </>
  );
};
