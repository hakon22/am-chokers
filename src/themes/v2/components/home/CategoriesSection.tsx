import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import { catalogPath } from '@/routes';
import { useAppSelector } from '@/hooks/reduxHooks';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { ItemGroupEntity } from '@server/db/entities/item.group.entity';
import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import styles from '@/themes/v2/components/home/CategoriesSection.module.scss';

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
}

export const CategoriesSection = ({ itemGroups }: CategoriesSectionProps) => {
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
          const name = group.translations.find((tr) => tr.lang === lang)?.name ?? group.code;
          return (
            <Link key={group.id} href={`${catalogPath}/${group.code}`} className={styles.catCard}>
              <div className={styles.catCardImg}>{getIcon(group.code)}</div>
              <div className={styles.catCardBody}>
                <div className={styles.catCardName}>{name}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </HomeSectionWrapper>
  );
};
