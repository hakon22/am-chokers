import { useContext, useEffect, useState, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Skeleton } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';
import cn from 'classnames';

import { SubmitContext, VersionContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppSelector } from '@/hooks/reduxHooks';
import { AdminPickupSiteSettingsSection } from '@/components/admin/AdminPickupSiteSettingsSection';
import { routes } from '@/routes';
import styles from '@/themes/v2/components/profile/V2AdminSettings.module.scss';
import type { SiteVersion } from '@/types/SiteVersion';
import type { CacheInfoInterface, CacheItemInterface } from '@server/types/db/cache-info.interface';

const CacheCard = ({ title, info }: { title: string; info: CacheItemInterface }) => {
  const match = info.postgreSql === info.redis;
  return (
    <div className={styles.card} style={{ marginBottom: 0 }}>
      <p className={styles.cardTitle}>{title}</p>
      <div className={styles.cacheRow}>
        <span className={cn(styles.cacheLabel)} style={{ textAlign: 'left' }}>PostgreSQL</span>
        <span className={styles.cacheVal}>{info.postgreSql}</span>
        <span className={styles.cacheLabel}>Redis</span>
        <span className={cn(styles.cacheVal, match ? styles.cacheValOk : styles.cacheValBad)}>
          {match ? <CheckOutlined /> : <CloseOutlined />} {info.redis}
        </span>
      </div>
    </div>
  );
};

export const V2AdminSettings = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);
  const { version: currentVersion } = useContext(VersionContext);

  const { axiosAuth } = useAppSelector((state) => state.app);

  const [cacheInfo, setCacheInfo] = useState<CacheInfoInterface>();
  const [siteVersion, setSiteVersion] = useState<SiteVersion>(currentVersion);

  const getCacheInfo = async () => {
    const { data } = await axios.get<{ code: number; result: CacheInfoInterface }>(routes.item.getCacheInfo);
    if (data.code === 1) setCacheInfo(data.result);
  };

  const getCacheInfoEffect = useEffectEvent(getCacheInfo);

  const updateSiteVersion = async (version: SiteVersion) => {
    try {
      setIsSubmit(true);
      await axios.patch(routes.settings.updateSiteVersion, { version });
      setSiteVersion(version);
      toast(tToast('siteVersionUpdated'), 'success');
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    } finally {
      setIsSubmit(false);
    }
  };

  const synchronizationCache = async () => {
    try {
      setIsSubmit(true);
      await axios.post(routes.item.synchronizationCache);
      await getCacheInfo();
      toast(tToast('synchronizationCacheComplete'), 'success');
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    } finally {
      setIsSubmit(false);
    }
  };

  useEffect(() => {
    if (axiosAuth) getCacheInfoEffect();
  }, [axiosAuth]);

  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>{t('title')}</h2>

      {/* ── Site version ── */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>{t('siteVersion.title')}</p>
        <p className={styles.cardDesc}>{t('siteVersion.description')}</p>
        <Select
          value={siteVersion}
          onChange={updateSiteVersion}
          style={{ width: '100%' }}
          options={[
            { value: 'v1', label: t('siteVersion.v1Label') },
            { value: 'v2', label: t('siteVersion.v2Label') },
            { value: 'v3', label: t('siteVersion.v3Label') },
          ]}
        />
      </div>

      <AdminPickupSiteSettingsSection variant="v2" />

      {/* ── Cache info ── */}
      {cacheInfo ? (
        <>
          <CacheCard title={t('cache.items')}      info={cacheInfo.items} />
          <CacheCard title={t('cache.itemGroups')} info={cacheInfo.itemGroups} />
          <CacheCard title={t('cache.itemGrades')} info={cacheInfo.itemGrades} />
          <button type="button" className={styles.btnSubmit} onClick={synchronizationCache}>
            {t('cache.synchronizationCache')}
          </button>
        </>
      ) : (
        <Skeleton active />
      )}
    </div>
  );
};
