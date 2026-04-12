import { Button, Card } from 'antd';
import { InstagramOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';
import { useTranslation } from 'react-i18next';

import { HomeSectionWrapper } from '@/themes/v2/components/home/HomeSectionWrapper';
import styles from '@/themes/v2/components/home/SocialSection.module.scss';

export const SocialSection = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.v2Home.social' });

  const placeholders = Array.from({ length: 6 }, (_, i) => i);

  return (
    <HomeSectionWrapper>
      {/**
      <div className={styles.sectionHead}>
        <div>
          <div className={styles.eyebrow}>{t('eyebrow')}</div>
          <h2 className={styles.title}>{t('title')}</h2>
        </div>
        <a
          href={process.env.NEXT_PUBLIC_URL_INST_ACCOUNT ?? '#'}
          target="_blank"
          rel="noreferrer"
          className={styles.seeAllLink}
        >
          <InstagramOutlined /> {t('followLink')}*
        </a>
      </div>

      <div className={styles.socialStrip}>
        {placeholders.map((i) => (
          <div key={i} className={styles.socialItem}>
            <span className={styles.socialItemPh}>✦</span>
          </div>
        ))}
      </div>
      */}

      <Card className={styles.tgBanner}>
        <div className={styles.tgIcon}><Telegram /></div>
        <div className={styles.tgText}>
          <div className={styles.tgTitle}>{t('tgTitle')}</div>
          <div className={styles.tgSub}>{t('tgSub')}</div>
        </div>
        <Button
          type="default"
          size="large"
          icon={<Telegram className={styles.tgBtnIcon} aria-hidden />}
          href={process.env.NEXT_PUBLIC_URL_TG_ACCOUNT ?? '#'}
          target="_blank"
          className={styles.tgBtn}
        >
          {t('tgBtn')}
        </Button>
      </Card>
    </HomeSectionWrapper>
  );
};
