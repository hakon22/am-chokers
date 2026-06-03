import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Col, Row, Segmented } from 'antd';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { SalesReportDistributionMetricEnum } from '@server/types/reports/sales/enums/sales-report-distribution-metric.enum';
import { SALES_REPORT_BAR_COLOR } from '@/components/admin/sales-report/salesReportConstants';
import { buildDeliveryPieChartData, buildOrdersByStatusBarChartData } from '@/components/admin/sales-report/salesReportChartData';
import type { SalesReportInterface } from '@server/types/reports/sales/sales-report.interface';

type SalesReportDistributionChartsProps = {
  revenueByDeliveryType: SalesReportInterface['revenueByDeliveryType'];
  ordersByStatus: SalesReportInterface['ordersByStatus'];
  revenueByStatus: SalesReportInterface['revenueByStatus'];
  lang: UserLangEnum;
  variant?: 'v1' | 'v2';
  cardClassName?: string;
  chartCardClassName?: string;
};

/**
 * Блок распределения: доставка и статусы с переключением суммы и количества
 * @param props - данные отчёта и настройки отображения
 * @returns сгруппированные pie/bar charts
 */
export const SalesReportDistributionCharts = ({
  revenueByDeliveryType,
  ordersByStatus,
  revenueByStatus,
  lang,
  variant = 'v1',
  cardClassName,
  chartCardClassName,
}: SalesReportDistributionChartsProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });

  const [metric, setMetric] = useState<SalesReportDistributionMetricEnum>(
    SalesReportDistributionMetricEnum.REVENUE,
  );

  const isRevenueMetric = metric === SalesReportDistributionMetricEnum.REVENUE;

  const pieData = useMemo(
    () => buildDeliveryPieChartData(revenueByDeliveryType, lang, metric),
    [revenueByDeliveryType, lang, metric],
  );

  const barData = useMemo(
    () => buildOrdersByStatusBarChartData(ordersByStatus, revenueByStatus, tOrders, metric),
    [ordersByStatus, revenueByStatus, tOrders, metric],
  );

  const metricControl = (
    <Segmented
      value={metric}
      onChange={(value) => setMetric(value as SalesReportDistributionMetricEnum)}
      options={[
        { value: SalesReportDistributionMetricEnum.REVENUE, label: t('charts.metricRevenue') },
        { value: SalesReportDistributionMetricEnum.COUNT, label: t('charts.metricCount') },
      ]}
    />
  );

  const formatPieLabel = (props: { name?: string; value?: number; }) => {
    const { name = '', value = 0 } = props;
    return isRevenueMetric ? `${name}: ${value} ₽` : `${name}: ${value}`;
  };

  const formatTooltip = (value: number) => (
    isRevenueMetric ? `${value} ₽` : `${value}`
  );

  const deliveryChart = pieData.length ? (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={formatPieLabel}
        >
          {pieData.map((entry) => (
            <Cell key={entry.type} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip formatter={formatTooltip} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  ) : null;

  const statusChart = barData.length ? (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={barData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" interval={0} angle={-25} textAnchor="end" height={80} />
        <YAxis allowDecimals={isRevenueMetric} />
        <Tooltip formatter={formatTooltip} />
        <Bar
          dataKey="value"
          name={isRevenueMetric ? t('chart.revenue') : t('chart.ordersCount')}
          fill={SALES_REPORT_BAR_COLOR}
        />
      </BarChart>
    </ResponsiveContainer>
  ) : null;

  if (!pieData.length && !barData.length) {
    return null;
  }

  if (variant === 'v2') {
    return (
      <Card className={cardClassName || chartCardClassName} title={t('charts.distributionTitle')}>
        <div className="mb-3">{metricControl}</div>
        <Row gutter={[16, 16]}>
          {!!pieData.length && (
            <Col xs={24} lg={12}>
              <h5 className="mb-3">{t('charts.deliveryTitle')}</h5>
              {deliveryChart}
            </Col>
          )}
          {!!barData.length && (
            <Col xs={24} lg={12}>
              <h5 className="mb-3">{t('charts.statusTitle')}</h5>
              {statusChart}
            </Col>
          )}
        </Row>
      </Card>
    );
  }

  return (
    <div className="mt-4 mb-4">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 mb-3">
        <h3 className="mb-0 fs-4">{t('charts.distributionTitle')}</h3>
        {metricControl}
      </div>
      <Row gutter={[16, 16]}>
        {!!pieData.length && (
          <Col xs={24} lg={12}>
            <h5 className="mb-3">{t('charts.deliveryTitle')}</h5>
            {deliveryChart}
          </Col>
        )}
        {!!barData.length && (
          <Col xs={24} lg={12}>
            <h5 className="mb-3">{t('charts.statusTitle')}</h5>
            {statusChart}
          </Col>
        )}
      </Row>
    </div>
  );
};
