import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';
import { AdminChartPeriodControl } from '@/components/admin/AdminChartPeriodControl';
import { getChartPeriodTotals } from '@/components/admin/sales-report/salesReportChartData';
import {
  SALES_REPORT_ORDERS_COLOR,
  SALES_REPORT_REVENUE_COLOR,
  SALES_REPORT_REVENUE_STROKE,
} from '@/components/admin/sales-report/salesReportConstants';

type SalesReportAreaChartProps = {
  chartData: { date: string; revenue: number; ordersCount: number; }[];
  period: ChartPeriodEnum;
  setPeriod: (period: ChartPeriodEnum) => void;
  variant?: 'v1' | 'v2';
};

/**
 * График выручки и заказов за период
 * @param props - данные графика и управление сериями
 * @returns AreaChart recharts
 */
export const SalesReportAreaChart = ({
  chartData,
  period,
  setPeriod,
  variant = 'v1',
}: SalesReportAreaChartProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.sales' });

  const [showOnlyTotal, setShowOnlyTotal] = useState(false);
  const [hiddenLines, setHiddenLines] = useState<Record<string, boolean>>({});

  const chartPeriodTotals = useMemo(() => getChartPeriodTotals(chartData), [chartData]);

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
    <div className="metric-report">
      <div className={`d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 mb-3 ${variant === 'v2' ? 'justify-content-between' : ''}`}>
        <AdminChartPeriodControl
          period={period}
          setPeriod={setPeriod}
          t={t}
          variant={variant}
        />
        <button
          type="button"
          className="btn btn-sm btn-outline-primary"
          onClick={() => setShowOnlyTotal(!showOnlyTotal)}
        >
          {showOnlyTotal ? t('chart.controls.showAll') : t('chart.controls.justTotal')}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="sales-revenue-gradient" x1="0" y1="0" x2="0" y2="1">
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
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            name={t('chart.actionTotalRevenue')}
            stroke={SALES_REPORT_REVENUE_STROKE}
            fill="url(#sales-revenue-gradient)"
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

      <div className="mt-3">
        <h5>{t('chart.statistics.title')}</h5>
        <p>{t('chart.statistics.revenue', { value: chartPeriodTotals.revenue })}</p>
        <p>{t('chart.statistics.orders', { count: chartPeriodTotals.ordersCount })}</p>
      </div>
    </div>
  );
};
