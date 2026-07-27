import { useTranslation } from 'react-i18next';
import { useContext, useState } from 'react';
import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { useTryOnAnalyticsReport } from '@/hooks/useTryOnAnalyticsReport';
import { BackButton } from '@/components/BackButton';
import { MobileContext } from '@/components/Context';
import { AdminTryOnAnalyticsView } from '@/components/admin/try-on-report/AdminTryOnAnalyticsView';
import { TryOnReportRegistry } from '@/components/admin/try-on-report/TryOnReportRegistry';

/**
 * Страница отчёта AI-примерки для темы V1
 * @returns JSX страницы с вкладками аналитики и реестра
 */
export const V1AdminTryOnReport = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();
  const { isMobile } = useContext(MobileContext);
  const urlParams = useSearchParams();
  const initialTab = urlParams.get('tab') === 'analytics' ? 'analytics' : 'registry';

  const { pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);
  const lang = useUserLang();

  const [activeTab, setActiveTab] = useState(initialTab);
  const analyticsState = useTryOnAnalyticsReport(tToast, { enabled: activeTab === 'analytics' });

  /**
   * Переключает вкладку и синхронизирует tab в URL
   * @param tabKey - ключ вкладки
   */
  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    const analyticsQueryKeys = ['tab', 'from', 'to', 'vtoTypes', 'ignorePeriod', 'attributionWindowDays'] as const;
    const restQuery = Object.fromEntries(
      Object.entries(router.query).filter(([key]) => !analyticsQueryKeys.includes(key as typeof analyticsQueryKeys[number])),
    );

    if (tabKey === 'analytics') {
      router.push({
        query: {
          ...restQuery,
          tab: 'analytics',
          ...(router.query.from ? { from: router.query.from } : {}),
          ...(router.query.to ? { to: router.query.to } : {}),
          ...(router.query.vtoTypes ? { vtoTypes: router.query.vtoTypes } : {}),
          ...(router.query.ignorePeriod ? { ignorePeriod: router.query.ignorePeriod } : {}),
          ...(router.query.attributionWindowDays ? { attributionWindowDays: router.query.attributionWindowDays } : {}),
        },
      }, undefined, { shallow: true });
      return;
    }

    router.push({ query: restQuery }, undefined, { shallow: true });
  };

  if (!isAdmin) {
    return null;
  }

  const tabItems = [
    {
      key: 'registry',
      label: t('tabs.registry'),
      children: <TryOnReportRegistry />,
    },
    {
      key: 'analytics',
      label: t('tabs.analytics'),
      children: <AdminTryOnAnalyticsView reportState={analyticsState} lang={lang} />,
    },
  ];

  return (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>
        {activeTab === 'registry'
          ? t('titleWithCount', { count: pagination.count })
          : t('title')}
      </h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-5">
        <BackButton style={{}} />
      </div>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={tabItems}
        destroyOnHidden
      />
    </div>
  );
};
