import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

import { catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { CoverTypeEnum } from '@server/utilities/enums/cover.type.enum';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import { ContextMenu } from '@/components/ContextMenu';
import styles from '@/themes/v2/components/home/CategoriesSection.module.scss';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import type { GeneralPageCoverImageInterface } from '@/types/item/Item';

const GROUP_ICONS: Record<string, string> = {
  chokers: '📿',
  necklaces: '💎',
  bracelets: '✨',
  earrings: '🌸',
  chains: '👓',
};

const getIcon = (code: string) => GROUP_ICONS[code] ?? '✦';

interface CategoriesSectionProps {
  itemGroups: ItemGroupEntity[];
  coverImages?: GeneralPageCoverImageInterface;
}

export const CategoriesSection = ({ itemGroups, coverImages }: CategoriesSectionProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.categories' });
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const sortedGroups = [...itemGroups].sort((a, b) => a.order - b.order);

  return (
    <HomeSectionWrapper>
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
        <Link href={catalogPath} className={styles.seeAllLink}>
          {t('seeAll')} →
        </Link>
      </div>
      <div className={styles.catGrid}>
        {sortedGroups.map((group) => {
          const name = group.translations.find((translation) => translation.lang === lang)?.name ?? group.code;
          const img = coverImages?.[`${CoverTypeEnum.GROUP_IMAGE}${group.id}` as keyof GeneralPageCoverImageInterface];

          return (
            <ContextMenu key={group.id} cover={group.id} coverType={CoverTypeEnum.GROUP_IMAGE} image={img} siteVersion={2}>
              <Link href={`${catalogPath}/${group.code}`} className={styles.catCard}>
                <div className={styles.catCardImg}>
                  {img ? (
                    <Image src={img.src} alt={name} fill style={{ objectFit: 'cover' }} />
                  ) : (
                    getIcon(group.code)
                  )}
                </div>
                <div className={styles.catCardBody}>
                  <div className={styles.catCardName}>{name}</div>
                </div>
              </Link>
            </ContextMenu>
          );
        })}
      </div>
    </HomeSectionWrapper>
  );
};
