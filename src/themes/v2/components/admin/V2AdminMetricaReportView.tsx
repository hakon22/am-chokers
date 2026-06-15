import { useState, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import moment, { type Moment } from 'moment';
import { Button, Card, Col, DatePicker, Row, Segmented } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { AdminChartPeriodControl } from '@/components/admin/AdminChartPeriodControl';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';
import styles from '@/themes/v2/components/admin/V2AdminMetricaReport.module.scss';
import type { useMetricaReport } from '@/hooks/useMetricaReport';

const { RangePicker: MomentRangePicker } = DatePicker.generatePicker<Moment>(momentGenerateConfig);

type V2AdminMetricaReportViewProps = {
  reportState: ReturnType<typeof useMetricaReport>;
  lang: UserLangEnum;
};

export const V2AdminMetricaReportView = ({ reportState, lang }: V2AdminMetricaReportViewProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.metrica' });

  const {
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
  } = reportState;

  const [showOnlyTotal, setShowOnlyTotal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const dateRangeValue: [Moment, Moment] | null = from && to
    ? [moment(fromParams || from), moment(toParams || to)]
    : null;

  /**
   * Обновляет диапазон дат отчёта
   * @param values - выбранный диапазон или null
   */
  const handleDateRangeChange = (values: [Moment | null, Moment | null] | null) => {
    if (!values?.[0] || !values[1]) {
      setFrom(moment().startOf('month').format(DateFormatEnum.YYYY_MM_DD));
      setTo(moment().endOf('month').format(DateFormatEnum.YYYY_MM_DD));
      return;
    }
    setFrom(values[0].format(DateFormatEnum.YYYY_MM_DD));
    setTo(values[1].format(DateFormatEnum.YYYY_MM_DD));
  };

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
            fill={`url(#v2-metrica-clicks-${id})`}
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

  return (
    <div className={styles.report}>
      <Card className={styles.filtersCard}>
        <div className={styles.filtersRow}>
          <MomentRangePicker
            className={styles.dateRange}
            value={dateRangeValue}
            onChange={handleDateRangeChange}
            format={DateFormatEnum.DD_MM_YYYY}
            locale={lang === UserLangEnum.RU ? locale : undefined}
          />
        </div>
      </Card>

      {data && (
        <>
          <Card className={styles.chartCard} title={t('chart.statistics.title')}>
            <div className={styles.chartControls}>
              <AdminChartPeriodControl period={period} setPeriod={setPeriod} t={t} variant="v2" />
              <Segmented
                options={[
                  { label: t('chart.controls.justTotal'), value: 'total' },
                  { label: t('chart.controls.showAll'), value: 'all' },
                ]}
                value={showOnlyTotal ? 'total' : 'all'}
                onChange={(value) => setShowOnlyTotal(value === 'total')}
              />
              {Object.entries(data.campaignStats).map(([id, campaign]) => (
                <Button
                  key={id}
                  className={styles.campaignButton}
                  variant={selectedCampaigns.includes(+id) ? 'filled' : 'outlined'}
                  onClick={() => handleCampaignToggle(+id)}
                  style={{ borderColor: campaign.color[0], color: campaign.color[0] }}
                >
                  {campaign.name}
                </Button>
              ))}
              {selectedCampaigns.length !== 0 && (
                <Button type="link" onClick={() => setSelectedCampaigns([])}>{t('chart.reset')}</Button>
              )}
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  {Object.entries(data.campaignStats).map(([id, campaign]) => (
                    <linearGradient key={`v2-metrica-clicks-${id}`} id={`v2-metrica-clicks-${id}`} x1="0" y1="0" x2="0" y2="1">
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
                      <span className={isHidden ? styles.legendHidden : undefined}>
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
          </Card>

          <Row gutter={[16, 16]} className={styles.kpiRow}>
            {Object.entries(data.campaignStats)
              .filter(([id]) => !selectedCampaigns.length || selectedCampaigns.includes(+id))
              .map(([id, campaign]) => (
                <Col key={+id} xs={24} sm={12} md={8}>
                  <Card className={styles.kpiCard}>
                    <h3 className={styles.kpiTitle} style={{ color: campaign.color[0] }}>
                      {campaign.name}
                    </h3>
                    <p className={styles.kpiMetric}>{t('chart.statistics.clicks')} {campaign.totalClicks}</p>
                    <p className={styles.kpiMetric}>{t('chart.statistics.cost', { cost: campaign.totalCost })}</p>
                    <p className={styles.kpiMetric}>{t('chart.statistics.failure')} {campaign.totalFailurePercentage}</p>
                  </Card>
                </Col>
              ))}
            <Col xs={24} sm={12} md={8}>
              <Card className={`${styles.kpiCard} ${styles.kpiCardTotal}`}>
                <h3 className={styles.kpiTitle}>{t('chart.statistics.total')}</h3>
                <p className={styles.kpiMetric}>{t('chart.statistics.clicks')} {data.totalStats?.totalClicks ?? 0}</p>
                <p className={styles.kpiMetric}>{t('chart.statistics.cost', { cost: data.totalStats?.totalCost ?? 0 })}</p>
                <p className={styles.kpiMetric}>{t('chart.statistics.failure')} {data.totalStats?.totalFailurePercentage ?? 0}</p>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};
