import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { useAppSelector } from '@/hooks/reduxHooks';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { getHref } from '@/utilities/getHref';
import type { ItemInterface, GeneralPageCollectionInterface } from '@/types/item/Item';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import styles from '@/themes/v2/components/home/CollectionsMosaic.module.scss';

interface CollectionTileProps {
  item: ItemInterface;
  small?: boolean;
}

const CollectionTile = ({ item, small }: CollectionTileProps) => {
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const name = item.translations?.find((tr) => tr.lang === lang)?.name ?? item.translateName ?? '';
  const groupName = item.group?.translations?.find((tr) => tr.lang === lang)?.name ?? '';
  const image = item.images?.[0];

  return (
    <Link href={getHref(item)} className={small ? styles.tileSm : styles.tile}>
      {image && (
        <Image src={image.url} alt={name} fill style={{ objectFit: 'cover' }} />
      )}
      <div className={styles.tileOverlay} />
      <div className={styles.tileBody}>
        <div className={styles.tileTag}>{groupName}</div>
        <div className={styles.tileName}>{name}</div>
      </div>
    </Link>
  );
};

interface CollectionsMosaicProps {
  collections: GeneralPageCollectionInterface;
}

export const CollectionsMosaic = ({ collections }: CollectionsMosaicProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.collections' });

  const mainItems = [
    collections.collection1,
    collections.collection2,
    collections.collection3,
  ].filter(Boolean) as ItemInterface[];

  const smallItems = [
    collections.collection4,
    collections.collection5,
  ].filter(Boolean) as ItemInterface[];

  if (mainItems.length === 0) return null;

  return (
    <HomeSectionWrapper alt>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
      </div>

      <div className={styles.grid}>
        {mainItems.map((item) => (
          <CollectionTile key={item.id} item={item} />
        ))}
      </div>

      {smallItems.length > 0 && (
        <div className={styles.rowSmall}>
          {smallItems.map((item) => (
            <CollectionTile key={item.id} item={item} small />
          ))}
        </div>
      )}
    </HomeSectionWrapper>
  );
};
