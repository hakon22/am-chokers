import { useTranslation } from 'react-i18next';
import { useContext, useState, Fragment } from 'react';
import { DatePicker, Button } from 'antd';
import moment, { type Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { useMetricaReport } from '@/hooks/useMetricaReport';
import { BackButton } from '@/components/BackButton';
import { MobileContext } from '@/components/Context';
import { AdminChartPeriodControl } from '@/components/admin/AdminChartPeriodControl';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

export const V1AdminMetricaReport = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.metrica' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { isMobile } = useContext(MobileContext);
  const lang = useUserLang();

  const {
    isAdmin,
    data,
    from,
    to,
    period,
    selectedCampaigns,
    setFrom,
    setTo,
    setPeriod,
    setSelectedCampaigns,
    chartData,
    fromParams,
    toParams,
  } = useMetricaReport(tToast);

  const [showOnlyTotal, setShowOnlyTotal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  /**
   * Переключает видимость серии на графике по клику в легенде
   * @param dataKey - ключ серии Recharts
   */
  const handleLegendClick = (dataKey?: string) => {
    if (!dataKey) {
      return;
    }
    setHiddenLines((previousState) => ({
      ...previousState,
      [dataKey]: !previousState[dataKey],
    }));
  };

  /**
   * Переключает фильтр по рекламной кампании
   * @param campaignId - идентификатор кампании
   */
  const handleCampaignToggle = (campaignId: number) => {
    if (selectedCampaigns.includes(campaignId)) {
      setSelectedCampaigns(selectedCampaigns.filter((currentId) => currentId !== campaignId));
      return;
    }
    setSelectedCampaigns([...selectedCampaigns, campaignId]);
  };

  /**
   * Рендерит Area-серии по выбранным кампаниям
   * @returns фрагменты Recharts Area или null
   */
  const renderCampaignAreas = () => {
    if (showOnlyTotal) {
      return null;
    }

    return Object.entries(data?.campaignStats || {})
      .filter(([id]) => !selectedCampaigns.length || selectedCampaigns.includes(+id))
      .map(([id, campaign]) => (
        <Fragment key={id}>
          <Area
            yAxisId="left"
            type="monotone"
            dataKey={`clicks_${id}`}
            name={t('chart.actionClicks', { name: campaign.name })}
            stroke={campaign.color[0]}
            fill={`url(#color-clicks-${id})`}
            fillOpacity={0.3}
            strokeWidth={2}
            stackId="clicks"
            hide={hiddenLines[`clicks_${id}`]}
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey={`cost_${id}`}
            name={t('chart.actionCost', { name: campaign.name })}
            stroke={campaign.color[1]}
            fill="transparent"
            strokeWidth={1}
            strokeDasharray="3 3"
            hide={hiddenLines[`cost_${id}`]}
          />
          <Area
            yAxisId="failure"
            type="monotone"
            dataKey={`failure_${id}`}
            name={t('chart.actionFailure', { name: campaign.name })}
            stroke={campaign.color[2]}
            fill="transparent"
            strokeWidth={1}
            strokeDasharray="2 2"
            hide={hiddenLines[`failure_${id}`]}
          />
        </Fragment>
      ));
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title')}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center justify-content-xl-between gap-2 mb-3 mb-xl-5">
        <BackButton style={{}} />
        <div className="d-flex flex-column gap-2">
          <AdminChartPeriodControl period={period} setPeriod={setPeriod} t={t} variant="v1" />
          <div className="btn-group">
            <Button
              variant={showOnlyTotal ? 'filled' : 'outlined'}
              onClick={() => setShowOnlyTotal(!showOnlyTotal)}
            >
              {showOnlyTotal ? t('chart.controls.showAll') : t('chart.controls.justTotal')}
            </Button>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {Object.entries(data?.campaignStats || {}).map(([id, campaign]) => (
              <Button
                key={id}
                variant={selectedCampaigns.includes(+id) ? 'filled' : 'outlined'}
                onClick={() => handleCampaignToggle(+id)}
                style={{ borderColor: campaign.color[0], color: campaign.color[0] }}
              >
                {campaign.name}
              </Button>
            ))}
            {selectedCampaigns.length !== 0 && (
              <Button variant="link" onClick={() => setSelectedCampaigns([])}>{t('chart.reset')}</Button>
            )}
          </div>
        </div>
        <div className="d-flex flex-column flex-xl-row gap-2">
          <MomentDatePicker
            className="w-100"
            placeholder={t('from')}
            onChange={(value) => setFrom(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD))}
            allowClear
            value={from ? moment(fromParams || from) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
          <MomentDatePicker
            className="w-100"
            placeholder={t('to')}
            onChange={(value) => setTo(value ? value.format(DateFormatEnum.YYYY_MM_DD) : moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD))}
            allowClear
            value={to ? moment(toParams || to) : undefined}
            showNow={false}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
        </div>
      </div>
      <div className="metric-report">
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <defs>
              {Object.entries(data?.campaignStats || {}).map(([id, campaign]) => (
                <linearGradient key={`color-clicks-${id}`} id={`color-clicks-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={campaign.color[0]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={campaign.color[0]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: t('chart.clicks'), angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: t('chart.cost'), angle: 90, position: 'insideRight' }} />
            <YAxis yAxisId="failure" orientation="right" label={{ value: t('chart.failure'), angle: 90, offset: 25, position: 'insideRight' }} />
            <Tooltip />
            <Legend
              onClick={(entry) => handleLegendClick(entry.dataKey as string)}
              formatter={(value, entry) => {
                const isHidden = hiddenLines[entry.dataKey as string];
                return (
                  <span style={{
                    textDecoration: isHidden ? 'line-through' : 'none',
                    cursor: 'pointer',
                  }}
                  >
                    {value}
                  </span>
                );
              }}
            />
            {renderCampaignAreas()}
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="totalClicks"
              name={t('chart.actionTotalClicks')}
              stroke="#000000"
              fill="transparent"
              strokeWidth={3}
              hide={hiddenLines.totalClicks}
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="totalCost"
              name={t('chart.actionTotalCost')}
              stroke="#ff0000"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
              hide={hiddenLines.totalCost}
            />
            <Area
              yAxisId="failure"
              type="monotone"
              dataKey="totalFailurePercentage"
              name={t('chart.actionTotalFailure')}
              stroke="#8884d8"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="3 3"
              hide={hiddenLines.totalFailurePercentage}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-4">
          <h5>{t('chart.statistics.title')}</h5>
          <div className="row">
            {Object.entries(data?.campaignStats || {})
              .filter(([id]) => !selectedCampaigns.length || selectedCampaigns.includes(+id))
              .map(([id, campaign]) => (
                <div key={+id} className="col-md-4 mb-3">
                  <div className="card">
                    <div className="card-body">
                      <h6 className="card-title" style={{ color: campaign.color[0] }}>
                        {campaign.name}
                      </h6>
                      <p>{t('chart.statistics.clicks')} {campaign.totalClicks}</p>
                      <p>{t('chart.statistics.cost', { cost: campaign.totalCost })}</p>
                      <p>{t('chart.statistics.failure')} {campaign.totalFailurePercentage}</p>
                    </div>
                  </div>
                </div>
              ))}
            <div className="col-md-4 mb-3">
              <div className="card border-primary">
                <div className="card-body">
                  <h6 className="card-title text-primary">{t('chart.statistics.total')}</h6>
                  <p>{t('chart.statistics.clicks')} {data?.totalStats?.totalClicks ?? 0}</p>
                  <p>{t('chart.statistics.cost', { cost: data?.totalStats?.totalCost ?? 0 })}</p>
                  <p>{t('chart.statistics.failure')} {data?.totalStats?.totalFailurePercentage ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
