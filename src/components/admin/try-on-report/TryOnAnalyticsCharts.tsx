import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Row } from 'antd';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { AdminChartPeriodControl } from '@/components/admin/AdminChartPeriodControl';
import {
  getTryOnChartPeriodTotals,
  TRY_ON_REPORT_AI_COST_COLOR,
  TRY_ON_REPORT_AI_COST_STROKE,
  TRY_ON_REPORT_BAR_COLOR,
  TRY_ON_REPORT_PIE_COLORS,
  TRY_ON_REPORT_TRY_ONS_COLOR,
} from '@/components/admin/try-on-report/tryOnReportChartData';
import type { TryOnAnalyticsReportInterface } from '@server/types/reports/try-on/try-on-analytics-report.interface';

type TryOnAnalyticsChartsProps = {
  chartData: { date: string; tryOnsCount: number; aiCost: number; }[];
  period: ChartPeriodEnum;
  setPeriod: (period: ChartPeriodEnum) => void;
  statusFunnel: TryOnAnalyticsReportInterface['statusFunnel'];
  variant?: 'v1' | 'v2';
  chartCardClassName?: string;
  chartControlsClassName?: string;
  chartTotalsClassName?: string;
  funnelCardClassName?: string;
  legendHiddenClassName?: string;
  secondaryChartsRowClassName?: string;
};

/**
 * Графики аналитики AI-примерки: динамика и воронка статусов
 * @param props - данные графиков и управление периодом
 * @returns блок графиков recharts
 */
export const TryOnAnalyticsCharts = ({
  chartData,
  period,
  setPeriod,
  statusFunnel,
  variant = 'v1',
  chartCardClassName,
  chartControlsClassName,
  chartTotalsClassName,
  funnelCardClassName,
  legendHiddenClassName,
  secondaryChartsRowClassName,
}: TryOnAnalyticsChartsProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn.analytics' });

  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const chartPeriodTotals = useMemo(() => getTryOnChartPeriodTotals(chartData), [chartData]);

  const funnelData = useMemo(() => statusFunnel
    .filter(({ count }) => count)
    .map(({ status, count }, index) => ({
      name: t(`status.${status}`),
      value: count,
      fill: TRY_ON_REPORT_PIE_COLORS[index % TRY_ON_REPORT_PIE_COLORS.length],
      status,
    })), [statusFunnel, t]);

  /**
   * Переключает видимость серии на графике
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

  const periodControl = (
    <AdminChartPeriodControl
      period={period}
      setPeriod={setPeriod}
      t={t}
      variant={variant}
    />
  );

  const areaChart = (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="try-on-ai-cost-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={TRY_ON_REPORT_AI_COST_COLOR} stopOpacity={0.8} />
            <stop offset="95%" stopColor={TRY_ON_REPORT_AI_COST_COLOR} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          yAxisId="tryOns"
          allowDecimals={false}
          label={{ value: t('chart.tryOnsCount'), angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="aiCost"
          orientation="right"
          label={{ value: t('chart.aiCost'), angle: 90, position: 'insideRight' }}
        />
        <Tooltip />
        <Legend
          onClick={(entry) => handleLegendClick(entry.dataKey as string)}
          formatter={(value, entry) => {
            const isHidden = hiddenLines[entry.dataKey as string];
            return (
              <span className={isHidden ? legendHiddenClassName : undefined}>
                {value}
              </span>
            );
          }}
        />
        <Area
          yAxisId="tryOns"
          type="monotone"
          dataKey="tryOnsCount"
          name={t('chart.actionTotalTryOns')}
          stroke={TRY_ON_REPORT_TRY_ONS_COLOR}
          fill="transparent"
          strokeWidth={2}
          hide={hiddenLines.tryOnsCount}
        />
        <Area
          yAxisId="aiCost"
          type="monotone"
          dataKey="aiCost"
          name={t('chart.actionTotalAiCost')}
          stroke={TRY_ON_REPORT_AI_COST_STROKE}
          fill="url(#try-on-ai-cost-gradient)"
          fillOpacity={1}
          strokeWidth={2}
          hide={hiddenLines.aiCost}
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const chartTotals = variant === 'v2' && chartTotalsClassName ? (
    <div className={chartTotalsClassName}>
      <span>{t('chart.statistics.tryOns', { count: chartPeriodTotals.tryOnsCount })}</span>
      <span>{t('chart.statistics.aiCost', { value: chartPeriodTotals.aiCost })}</span>
    </div>
  ) : (
    <div className="mt-3">
      <h5>{t('chart.statistics.title')}</h5>
      <p>{t('chart.statistics.tryOns', { count: chartPeriodTotals.tryOnsCount })}</p>
      <p>{t('chart.statistics.aiCost', { value: chartPeriodTotals.aiCost })}</p>
    </div>
  );

  const mainChartBlock = variant === 'v2' && chartCardClassName ? (
    <Card className={chartCardClassName} title={t('chart.statistics.title')}>
      <div className={chartControlsClassName}>
        {periodControl}
      </div>
      {areaChart}
      {chartTotals}
    </Card>
  ) : (
    <div className="metric-report mt-4 mb-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 mb-3 justify-content-between">
        {periodControl}
      </div>
      {areaChart}
      {chartTotals}
    </div>
  );

  const funnelBlock = !!funnelData.length && (
    <Card
      className={funnelCardClassName ?? 'mb-4'}
      title={t('charts.funnelTitle')}
    >
      <Row gutter={[16, 16]} className={secondaryChartsRowClassName}>
        <Col xs={24} lg={12}>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={funnelData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(props) => `${props.name}: ${props.value}`}
              >
                {funnelData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Col>
        <Col xs={24} lg={12}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} angle={-20} textAnchor="end" height={80} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" name={t('charts.metricCount')} fill={TRY_ON_REPORT_BAR_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </Col>
      </Row>
    </Card>
  );

  return (
    <>
      {mainChartBlock}
      {funnelBlock}
    </>
  );
};
