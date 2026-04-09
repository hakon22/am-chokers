import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState, useEffectEvent } from 'react';
import axios from 'axios';
import {
  Button, Card, Select, Skeleton,
} from 'antd';
import cn from 'classnames';

import { SubmitContext, VersionContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { V1AdminSettings } from '@/themes/v1/components/admin/V1AdminSettings';
import type { SiteVersion } from '@/types/SiteVersion';
import type { CacheInfoInterface, CacheItemInterface } from '@server/types/db/cache-info.interface';

export const AdminSettings = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);
  const { version: currentVersion } = useContext(VersionContext);

  if (currentVersion !== 'v2') return <V1AdminSettings />;

  const { axiosAuth } = useAppSelector((state) => state.app);

  const [cacheInfo, setCacheInfo] = useState<CacheInfoInterface>();
  const [siteVersion, setSiteVersion] = useState<SiteVersion>(currentVersion);

  const getCacheInfo = async () => {
    const { data } = await axios.get<{ code: number; result: CacheInfoInterface; }>(routes.item.getCacheInfo);
    if (data.code === 1) {
      setCacheInfo(data.result);
    }
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
      setIsSubmit(false);
      toast(tToast('synchronizationCacheComplete'), 'success');
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const cacheRow = (value: CacheItemInterface) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', gap: 24 }}>
      <div>
        <div style={{ fontSize: 11, color: '#8c8c8c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>PostgreSQL</div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>{value.postgreSql}</div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: '#8c8c8c', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}>Redis</div>
        <div className={cn({ 'text-success': value.postgreSql === value.redis, 'text-danger': value.postgreSql !== value.redis })} style={{ fontSize: 22, fontWeight: 600 }}>
          {value.postgreSql === value.redis ? '✓ ' : '✗ '}{value.redis}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    if (axiosAuth) {
      getCacheInfoEffect();
    }
  }, [axiosAuth]);

  return (
    <div className="d-flex flex-column col-11">
      <Card title={t('siteVersion.title')} className="col-12 col-xl-6 mb-5">
        <p className="text-muted mb-3">{t('siteVersion.description')}</p>
        <Select
          value={siteVersion}
          onChange={updateSiteVersion}
          style={{ width: 220 }}
          options={[
            { value: 'v1', label: t('siteVersion.v1Label') },
            { value: 'v2', label: t('siteVersion.v2Label') },
            { value: 'v3', label: t('siteVersion.v3Label') },
          ]}
        />
      </Card>
      {cacheInfo ? (
        <div className="d-flex flex-column">
          <Card title={t('cache.items')} className="col-12 col-xl-6 mb-3">{cacheRow(cacheInfo.items)}</Card>
          <Card title={t('cache.itemGroups')} className="col-12 col-xl-6 mb-3">{cacheRow(cacheInfo.itemGroups)}</Card>
          <Card title={t('cache.itemGrades')} className="col-12 col-xl-6 mb-3">{cacheRow(cacheInfo.itemGrades)}</Card>
          <div className="mt-5 d-flex justify-content-center mx-auto">
            <Button type="primary" className="button px-4" onClick={synchronizationCache}>
              {t('cache.synchronizationCache')}
            </Button>
          </div>
        </div>
      ) : <Skeleton active />}
    </div>
  );
};
