import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import moment from 'moment';
import Link from 'next/link';
import cn from 'classnames';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { BackButton } from '@/components/BackButton';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { UserCardInterface } from '@/types/user/User';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

import styles from './V2AdminUserCard.module.scss';

const coefficient = 1.3;
const imgWidth = 80;
const imgHeight = Math.round(imgWidth * coefficient);

interface Props {
  id: number;
}

export const V2AdminUserCard = ({ id }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.user' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { axiosAuth } = useAppSelector((state) => state.app);

  const [user, setUser] = useState<UserCardInterface>();

  const { setIsSubmit } = useContext(SubmitContext);

  const fetchUser = async (params: ParamsIdInterface) => {
    try {
      setIsSubmit(true);
      const { data: { user: fetchedUser, code } } = await axios.get<{ code: number; user: UserCardInterface; }>(routes.user.getUserCard(params.id));
      if (code === 1) {
        setUser(fetchedUser);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const fetchUserEffect = useEffectEvent(fetchUser);

  useEffect(() => {
    if (axiosAuth) {
      fetchUserEffect({ id });
    }
  }, [axiosAuth]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { username: user?.name })} description={t('description', { username: user?.name })} />

      <h1 className={styles.pageTitle}>{t('title', { username: user?.name })}</h1>

      <div className={styles.controls}>
        <BackButton style={{}} />
      </div>

      {/* ── Main info card ── */}
      <div className={styles.card}>
        <div className={styles.roleBadge}>{t(`roles.${user?.role}`)}</div>

        {/* Info grid: identity | contact | dates */}
        <div className={styles.infoGrid}>
          <div className={styles.infoSection}>
            <p className={styles.infoSectionTitle}>{t('username')}</p>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('role')}</span>
              <span className={styles.infoValue}>{t(`roles.${user?.role}`)}</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('phone')}</span>
              <Link href={`tel:+${user?.phone}`} className={styles.infoLink}>{user?.phone}</Link>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('telegram')}</span>
              {user?.telegramUsername ? (
                <a
                  href={`https://t.me/${user.telegramUsername}`}
                  className={styles.infoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{user.telegramUsername}
                </a>
              ) : user?.telegramId ? (
                <span className={styles.telegramOn}>✓ Telegram</span>
              ) : (
                <span className={styles.telegramOff}>—</span>
              )}
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('amount')}</span>
              <span className={styles.infoValue}>{tPrice('price', { price: user?.amount })}</span>
            </div>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('signupDate')}</span>
              <span className={styles.infoValue}>{moment(user?.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('lastActivity')}</span>
              <span className={styles.infoValue}>{moment(user?.updated).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('orders')}</span>
            <Link href={`${routes.page.admin.allOrders}?userId=${id}`} className={styles.statLink}>
              {user?.orders.length ?? 0}
            </Link>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('reviews')}</span>
            <Link href={`${routes.page.admin.moderationOfReview}?showAccepted=true&userId=${id}`} className={styles.statLink}>
              {user?.gradeCount ?? 0}
            </Link>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('messages')}</span>
            <Link href={`${routes.page.admin.messageReport}?userId=${id}`} className={styles.statLink}>
              {user?.messageCount ?? 0}
            </Link>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('cart')}</span>
            <Link href={`${routes.page.admin.cartReport}?userId=${id}`} className={styles.statLink}>
              {user?.cartCount ?? 0}
            </Link>
          </div>

          <div className={styles.statCard}>
            <span className={styles.statLabel}>{t('favorites')}</span>
            <span className={styles.statValue}>{user?.favorites?.length ?? 0}</span>
          </div>
        </div>
      </div>

      {/* ── Favorites card ── */}
      <div className={styles.favoritesCard}>
        <p className={styles.sectionTitle}>{t('favorites')}</p>

        {!user?.favorites?.length && (
          <span className={styles.emptyFavorites}>—</span>
        )}

        <div className={styles.favoritesGrid}>
          {user?.favorites?.map((item) => (
            <Link
              key={item.id}
              href={getHref(item)}
              className={cn(styles.favoriteCard, { [styles.favoriteDeleted]: !!item.deleted })}
            >
              <div className={styles.favoriteThumb}>
                <ImageHover
                  height={imgHeight}
                  width={imgWidth}
                  deleted={!!item.deleted}
                  images={item.images ?? []}
                />
              </div>
              <div className={styles.favoriteMeta}>
                <span className={styles.favoriteName}>
                  {item.translations.find((translation) => translation.lang === lang)?.name}
                </span>
                <span className={styles.favoritePrice}>
                  {tPrice('price', { price: item.price - item.discountPrice })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
