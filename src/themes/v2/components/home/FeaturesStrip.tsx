import { useTranslation } from 'react-i18next';
import { CarOutlined, CrownOutlined, CreditCardOutlined, UndoOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';

import styles from '@/themes/v2/components/home/FeaturesStrip.module.scss';

const FEATURES = [
  { icon: <CarOutlined />, key: 'delivery' },
  { icon: <CrownOutlined />, key: 'handmade' },
  { icon: <CreditCardOutlined />, key: 'payment' },
  { icon: <UndoOutlined />, key: 'returns' },
  { icon: <Telegram />, key: 'support' },
] as const;

export const FeaturesStrip = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.features' });

  return (
    <div className={styles.strip}>
      <div className={styles.stripInner}>
        {FEATURES.map(({ icon, key }) => (
          <div key={key} className={styles.stripItem}>
            <div className={styles.stripIcon}>{icon}</div>
            <div className={styles.stripText}>
              <strong>{t(`${key}.title`)}</strong>
              <span>{t(`${key}.subtitle`)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
