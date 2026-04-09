import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState, useEffectEvent } from 'react';
import axios from 'axios';
import {
  Button, Card, Descriptions, Select, Skeleton,
} from 'antd';
import cn from 'classnames';
import type { DescriptionsProps } from 'antd';

import { SubmitContext, VersionContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import type { SiteVersion } from '@/types/SiteVersion';
import type { CacheInfoInterface, CacheItemInterface } from '@server/types/db/cache-info.interface';

export const V1AdminSettings = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);
  const { version: currentVersion } = useContext(VersionContext);

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

  const parsedInfo = (value: CacheItemInterface): DescriptionsProps['items'] => [
    { key: 1, className: 'col-2', label: 'PostgreSQL', children: <span>{value.postgreSql}</span> },
    { key: 2, className: 'col-2', label: 'Redis', children: <span className={cn('fw-bold', { 'text-success': value.postgreSql === value.redis, 'text-danger': value.postgreSql !== value.redis })}>{value.redis}</span> },
  ];

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
          <Descriptions bordered style={{ marginBottom: '20px' }} className="col-12 col-xl-6" title={t('cache.items')} items={parsedInfo(cacheInfo.items)} />
          <Descriptions bordered style={{ marginBottom: '20px' }} className="col-12 col-xl-6" title={t('cache.itemGroups')} items={parsedInfo(cacheInfo.itemGroups)} />
          <Descriptions bordered style={{ marginBottom: '20px' }} className="col-12 col-xl-6" title={t('cache.itemGrades')} items={parsedInfo(cacheInfo.itemGrades)} />
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
