import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import moment, { type Moment } from 'moment';
import { Card, Checkbox, Col, DatePicker, Row, Segmented, Select, Space, Statistic } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { SalesReportPromoFilterEnum } from '@server/types/reports/sales/enums/sales-report-promo-filter.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { buildDeliveryTypeFilterOptions, formatChangePercentLabel, formatPreviousPeriodRangeLabel, getChartPeriodTotals, getComparisonChangeTone } from '@/components/admin/sales-report/salesReportChartData';
import { SalesReportDetailsTables } from '@/components/admin/sales-report/SalesReportDetailsTables';
import { SalesReportDistributionCharts } from '@/components/admin/sales-report/SalesReportDistributionCharts';
import { AdminChartPeriodControl } from '@/components/admin/AdminChartPeriodControl';
import {
  SALES_REPORT_ORDERS_COLOR,
  SALES_REPORT_REVENUE_COLOR,
  SALES_REPORT_REVENUE_STROKE,
} from '@/components/admin/sales-report/salesReportConstants';
import styles from '@/themes/v2/components/admin/V2AdminSalesReport.module.scss';
import type { SalesReportSummaryInterface } from '@server/types/reports/sales/sales-report-summary.interface';
import type { useSalesReport } from '@/hooks/useSalesReport';

const { RangePicker: MomentRangePicker } = DatePicker.generatePicker<Moment>(momentGenerateConfig);

type V2AdminSalesReportViewProps = {
  reportState: ReturnType<typeof useSalesReport>;
  lang: UserLangEnum;
};

const SUMMARY_METRIC_KEYS: (keyof SalesReportSummaryInterface)[] = [
  'totalRevenue',
  'goodsRevenue',
  'deliveryRevenue',
  'paidOrdersCount',
  'averageOrderValue',
  'itemsSoldCount',
  'averageItemsPerOrder',
  'uniqueCustomersCount',
  'promoOrdersCount',
  'totalOrdersCount',
  'paymentConversionRate',
  'canceledOrdersCount',
];

const SUMMARY_SUFFIX: Partial<Record<keyof SalesReportSummaryInterface, string>> = {
  totalRevenue: '₽',
  goodsRevenue: '₽',
  deliveryRevenue: '₽',
  averageOrderValue: '₽',
  paymentConversionRate: '%',
};

export const V2AdminSalesReportView = ({ reportState, lang }: V2AdminSalesReportViewProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });
  const { t: tRoot } = useTranslation('translation');

  const {
    data,
    from,
    to,
    period,
    deliveryTypes,
    promoFilter,
    ignorePeriod,
    setFrom,
    setTo,
    setPeriod,
    setDeliveryTypes,
    setPromoFilter,
    setIgnorePeriod,
    chartData,
    fromParams,
    toParams,
  } = reportState;

  const [showOnlyTotal, setShowOnlyTotal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const showComparison = !ignorePeriod && !!data?.comparison;
  const chartPeriodTotals = useMemo(() => getChartPeriodTotals(chartData), [chartData]);
  const previousPeriodRangeLabel = showComparison && from && to
    ? formatPreviousPeriodRangeLabel(from, to)
    : null;

  const changeToneClassNames = {
    positive: styles.changeValuePositive,
    negative: styles.changeValueNegative,
    neutral: styles.changeValueNeutral,
  } as const;

  const dateRangeValue: [Moment, Moment] | null = from && to && !ignorePeriod
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

  return (
    <div className={styles.report}>
      <Card className={styles.filtersCard}>
        <Space direction="vertical" size="middle" className={styles.filtersSpace}>
          <div className={styles.filtersRow}>
            <Checkbox
              checked={ignorePeriod}
              onChange={({ target }) => setIgnorePeriod(target.checked)}
            >
              {t('filters.ignorePeriod')}
            </Checkbox>
            <MomentRangePicker
              className={styles.dateRange}
              disabled={ignorePeriod}
              value={dateRangeValue}
              onChange={handleDateRangeChange}
              format={DateFormatEnum.DD_MM_YYYY}
              locale={lang === UserLangEnum.RU ? locale : undefined}
            />
            <Select
              mode="multiple"
              allowClear
              className={styles.deliverySelect}
              placeholder={t('filters.deliveryPlaceholder')}
              value={deliveryTypes}
              onChange={(values) => setDeliveryTypes(values)}
              options={buildDeliveryTypeFilterOptions(lang)}
            />
            <Select
              className={styles.promoSelect}
              value={promoFilter}
              onChange={(value) => setPromoFilter(value)}
              options={[
                { value: SalesReportPromoFilterEnum.ALL, label: t('filters.promoAll') },
                { value: SalesReportPromoFilterEnum.WITH, label: t('filters.promoWith') },
                { value: SalesReportPromoFilterEnum.WITHOUT, label: t('filters.promoWithout') },
              ]}
            />
          </div>
        </Space>
      </Card>

      {data && (
        <>
          {previousPeriodRangeLabel && (
            <p className={styles.comparisonPeriodHint}>
              {t('comparison.previousPeriodLabel', { range: previousPeriodRangeLabel })}
            </p>
          )}
          <Row gutter={[16, 16]} className={styles.kpiRow}>
            {SUMMARY_METRIC_KEYS.map((key) => {
              const changePercent = showComparison && data.comparison
                ? data.comparison.changesPercent[key]
                : undefined;
              const changeLabel = showComparison && data.comparison
                ? formatChangePercentLabel(changePercent, t)
                : null;
              const changeTone = getComparisonChangeTone(key, changePercent);

              return (
                <Col key={key} xs={24} sm={12} md={8} lg={6}>
                  <Card className={styles.kpiCard}>
                    <Statistic
                      title={t(`summary.${key}`)}
                      value={data.summary[key]}
                      suffix={SUMMARY_SUFFIX[key]}
                    />
                    {changeLabel && (
                      <span className={styles.changeLabel}>
                        <span className={changeToneClassNames[changeTone]}>{changeLabel}</span>
                        {' '}
                        {t('comparison.vsPreviousPeriod')}
                      </span>
                    )}
                  </Card>
                </Col>
              );
            })}
          </Row>

          <Card className={styles.chartCard} title={t('chart.statistics.title')}>
            <div className={styles.chartControls}>
              <AdminChartPeriodControl
                period={period}
                setPeriod={setPeriod}
                t={t}
                variant="v2"
              />
              <Segmented
                options={[
                  { label: t('chart.controls.justTotal'), value: 'revenue' },
                  { label: t('chart.controls.showAll'), value: 'all' },
                ]}
                value={showOnlyTotal ? 'revenue' : 'all'}
                onChange={(value) => setShowOnlyTotal(value === 'revenue')}
              />
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="v2-sales-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={SALES_REPORT_REVENUE_COLOR} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={SALES_REPORT_REVENUE_COLOR} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis
                  yAxisId="revenue"
                  label={{ value: t('chart.revenue'), angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="orders"
                  orientation="right"
                  allowDecimals={false}
                  label={{ value: t('chart.ordersCount'), angle: 90, position: 'insideRight' }}
                />
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
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  name={t('chart.actionTotalRevenue')}
                  stroke={SALES_REPORT_REVENUE_STROKE}
                  fill="url(#v2-sales-revenue-gradient)"
                  fillOpacity={1}
                  strokeWidth={2}
                  hide={hiddenLines.revenue}
                />
                {!showOnlyTotal && (
                  <Area
                    yAxisId="orders"
                    type="monotone"
                    dataKey="ordersCount"
                    name={t('chart.actionTotalOrders')}
                    stroke={SALES_REPORT_ORDERS_COLOR}
                    fill="transparent"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    hide={hiddenLines.ordersCount}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
            <div className={styles.chartTotals}>
              <span>{t('chart.statistics.revenue', { value: chartPeriodTotals.revenue })}</span>
              <span>{t('chart.statistics.orders', { count: chartPeriodTotals.ordersCount })}</span>
            </div>
          </Card>

          <SalesReportDistributionCharts
            revenueByDeliveryType={data.revenueByDeliveryType}
            ordersByStatus={data.ordersByStatus}
            revenueByStatus={data.revenueByStatus}
            lang={lang}
            variant="v2"
            cardClassName={styles.chartCard}
          />

          <SalesReportDetailsTables
            topProducts={data.topProducts}
            topPromos={data.topPromos}
            revenueByItemGroup={data.revenueByItemGroup}
            t={t}
            tRoot={tRoot}
            variant="v2"
            tableClassName={styles.table}
            cardClassName={styles.tableCard}
          />
        </>
      )}
    </div>
  );
};
