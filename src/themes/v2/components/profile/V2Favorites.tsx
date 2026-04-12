import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import { HeartOutlined } from '@ant-design/icons';
import cn from 'classnames';

import { useAppSelector } from '@/hooks/reduxHooks';
import { Favorites as FavoritesButton } from '@/components/Favorites';
import { V2CartControl } from '@/themes/v2/components/V2CartControl';
import { getHref } from '@/utilities/getHref';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import styles from '@/themes/v2/components/profile/V2Favorites.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';
import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';

const isVideo = (src: string) => src.endsWith('.mp4');

export const V2Favorites = () => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { favorites, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const sorted = [...(favorites ?? [])].sort((a, b) => (a.deleted ? 1 : 0) - (b.deleted ? 1 : 0));

  if (!sorted.length) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <HeartOutlined />
          <span>В избранном пока пусто</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {sorted.map((item) => {
        const name = item.translations.find((translation) => translation.lang === lang)?.name ?? '';
        const price = item.price - item.discountPrice;
        const cover = sortItemImagesByOrder(item.images)[0]?.src ?? '';
        const isDeleted = !!item.deleted || item.outStock;

        return (
          <div key={item.id} className={styles.item}>
            {/* Image */}
            <Link href={getHref(item)} className={styles.itemImg} tabIndex={-1}>
              {cover && (isVideo(cover)
                ? <video src={cover} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <V2Image src={cover} alt={name} fill style={{ objectFit: 'cover' }} unoptimized />
              )}
            </Link>

            {/* Body */}
            <div className={styles.itemBody}>
              <span className={styles.itemEyebrow}>
                {item.group?.translations?.find((translation) => translation.lang === lang)?.name ?? ''}
              </span>
              <div className={styles.itemNameRow}>
                <Link href={getHref(item)} className={cn(styles.itemName, { [styles.deleted]: isDeleted })}>
                  {name}
                </Link>
                {item.outStock && <span className={styles.badgeOutStock}>Нет в наличии</span>}
                {item.deleted  && <span className={styles.badgeDeleted}>Удалён</span>}
              </div>

              <span className={styles.itemPrice}>{tPrice('price', { price })}</span>

              {!isDeleted && (
                <div className={styles.itemActions}>
                  <V2CartControl
                    itemId={item.id}
                    variant="card"
                    addLabel="В корзину"
                    inCartLabel="В корзине"
                    addAriaLabel="Добавить в корзину"
                    removeAriaLabel="Убрать из корзины"
                  />
                  <FavoritesButton id={item.id} outlined />
                </div>
              )}
              {isDeleted && (
                <div className={styles.itemActions}>
                  <FavoritesButton id={item.id} outlined />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
