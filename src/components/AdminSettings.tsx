import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Descriptions, Skeleton } from 'antd';
import type { DescriptionsProps } from 'antd';

import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import type { CacheInfoInterface, CacheItemInterface } from '@server/types/db/cache-info.interface';

export const AdminSettings = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.adminSettings' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { setIsSubmit } = useContext(SubmitContext);

  const { axiosAuth } = useAppSelector((state) => state.app);

  const [cacheInfo, setCacheInfo] = useState<CacheInfoInterface>();

  const synchronizationCache = async () => {
    try {
      setIsSubmit(true);
      await axios.post(routes.item.synchronizationCache);
      setIsSubmit(false);
      toast(tToast('synchronizationCacheComplete'), 'success');
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const parsedInfo = (value: CacheItemInterface): DescriptionsProps['items'] => {
    return [
      { key: 1, className: 'col-2', label: 'PostgreSQL', children: value.postgreSql },
      { key: 2, className: 'col-2', label: 'Redis', children: value.redis },
    ];
  };

  useEffect(() => {
    if (axiosAuth) {
      axios.get<{ code: number; result: CacheInfoInterface; }>(routes.item.getCacheInfo)
        .then(({ data }) => {
          if (data.code === 1) {
            setCacheInfo(data.result);
          }
        });
    }
  }, [axiosAuth]);

  return (
    <div className="d-flex flex-column col-11">
      {cacheInfo ? (
        <div className="d-flex flex-column">
          <Descriptions bordered style={{ marginBottom: '20px' }} title="Items Info" items={parsedInfo(cacheInfo.items)} />
          <Descriptions bordered style={{ marginBottom: '20px' }} title="Items Info" items={parsedInfo(cacheInfo.itemGroups)} />
          <Descriptions bordered style={{ marginBottom: '20px' }} title="Items Info" items={parsedInfo(cacheInfo.itemGrades)} />
          <div className="mt-5 d-flex justify-content-center mx-auto">
            <Button type="primary" className="button px-4" onClick={synchronizationCache}>
              {t('synchronizationCache')}
            </Button>
          </div>
        </div>
      ) : <Skeleton active />}
    </div>
  );
};
