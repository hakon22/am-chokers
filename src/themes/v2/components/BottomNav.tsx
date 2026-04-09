import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeOutlined,
  AppstoreOutlined,
  UserOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import { Badge } from 'antd';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { useContext } from 'react';

import { routes } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { AuthModalContext } from '@/components/Context';
import styles from '@/themes/v2/components/BottomNav.module.scss';

export const BottomNav = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const router = useRouter();
  const { favorites, token } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);
  const { openAuthModal } = useContext(AuthModalContext);

  const cartCount = cart.reduce((acc, { count }) => acc + count, 0);
  const favCount = favorites?.length ?? 0;

  const isActive = (href: string) => router.asPath === href || router.asPath.startsWith(href + '/');

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.inner}>
        <Link href={routes.page.base.homePage} className={cn(styles.item, { [styles.active]: router.asPath === routes.page.base.homePage })}>
          <span className={styles.icon}><HomeOutlined /></span>
          {t('menu.home')}
        </Link>
        <Link href={routes.page.base.catalog} className={cn(styles.item, { [styles.active]: isActive(routes.page.base.catalog) })}>
          <span className={styles.icon}><AppstoreOutlined /></span>
          {t('menu.catalog')}
        </Link>
        {token ? (
          <Link href={routes.page.profile.personalData} className={cn(styles.item, { [styles.active]: isActive('/profile') })}>
            <span className={styles.icon}><UserOutlined /></span>
            {t('profile')}
          </Link>
        ) : (
          <button type="button" className={styles.item} onClick={() => openAuthModal?.('login')}>
            <span className={styles.icon}><UserOutlined /></span>
            {t('profile')}
          </button>
        )}
        {token ? (
          <Link href={routes.page.profile.favorites} className={cn(styles.item, { [styles.active]: isActive(routes.page.profile.favorites) })}>
            <span className={styles.icon}>
              <Badge count={favCount} size="small" offset={[4, -2]}>
                <HeartOutlined />
              </Badge>
            </span>
            {t('favorites')}
          </Link>
        ) : (
          <button type="button" className={styles.item} onClick={() => openAuthModal?.('login')}>
            <span className={styles.icon}><HeartOutlined /></span>
            {t('favorites')}
          </button>
        )}
        <Link href={routes.page.base.cartPage} className={cn(styles.item, { [styles.active]: isActive(routes.page.base.cartPage) })}>
          <span className={styles.icon}>
            <Badge count={cartCount} size="small" offset={[4, -2]}>
              <ShoppingCartOutlined />
            </Badge>
          </span>
          {t('cart')}
        </Link>
      </div>
    </nav>
  );
};
