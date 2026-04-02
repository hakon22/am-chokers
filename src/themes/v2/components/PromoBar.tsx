import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import { routes } from '@/routes';
import styles from '@/themes/v2/components/PromoBar.module.scss';

export const PromoBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'common.v2Promo' });

  return (
    <div className={styles.promoBar}>
      {t('text')}
      <Link href={routes.page.base.catalog}>{t('link')}</Link>
    </div>
  );
};
