import { useTranslation } from 'react-i18next';

import { routes } from '@/routes';
import styles from '@/themes/v2/components/home/CustomOrderSection.module.scss';

export const CustomOrderSection = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.customOrder' });

  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <div className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h2 className={styles.title}>
            {t('title')} <em>{t('titleEm')}</em>
          </h2>
          <p className={styles.text}>{t('text')}</p>
          <a
            href={process.env.NEXT_PUBLIC_URL_PERSONAL_TG_ACCOUNT ?? routes.page.base.homePage}
            target="_blank"
            rel="noreferrer"
            className={styles.tgBtn}
          >
            {t('tgBtn')}
          </a>
        </div>
        <div className={styles.right}>
          <ol className={styles.steps}>
            {steps.map((key, i) => (
              <li key={key} className={styles.step}>
                <div className={styles.stepNum}>{i + 1}</div>
                <div className={styles.stepText}>
                  <strong>{t(`${key}.title`)}</strong>
                  {t(`${key}.desc`)}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
};
