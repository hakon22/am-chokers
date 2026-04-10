import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import { ContextMenu } from '@/components/ContextMenu';
import styles from '@/themes/v2/components/home/CollectionsMosaic.module.scss';
import { CoverTypeEnum } from '@server/utilities/enums/cover.type.enum';
import type { GeneralPageCoverImageInterface } from '@/types/item/Item';
import type { ItemCollectionEntity } from '@server/db/entities/item.collection.entity';

interface CollectionsMosaicProps {
  collections: ItemCollectionEntity[];
  coverImages?: GeneralPageCoverImageInterface;
}

export const CollectionsMosaic = ({ collections, coverImages }: CollectionsMosaicProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.collections' });
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  if (!collections.length) {
    return null;
  }

  return (
    <HomeSectionWrapper alt>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
      </div>

      <div className={styles.colGrid}>
        {collections.map((collection) => {
          const name = collection.translations?.find((translation) => translation.lang === lang)?.name ?? '';
          const img = coverImages?.[`${CoverTypeEnum.COLLECTION_IMAGE}${collection.id}` as keyof GeneralPageCoverImageInterface];

          return (
            <ContextMenu key={collection.id} cover={collection.id} isCoverCollection image={img} siteVersion={2} style={{ height: '100%' }}>
              <Link href={`${catalogPath}?collectionIds=${collection.id}`} className={styles.tile}>
                {img && (
                  <Image src={img.src} alt={name} fill style={{ objectFit: 'cover' }} />
                )}
                <div className={styles.tileOverlay} />
                <div className={styles.tileBody}>
                  <div className={styles.tileName}>{name}</div>
                </div>
              </Link>
            </ContextMenu>
          );
        })}
      </div>
    </HomeSectionWrapper>
  );
};
