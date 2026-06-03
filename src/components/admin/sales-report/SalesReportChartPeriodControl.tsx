import { Radio, Segmented } from 'antd';
import type { TFunction } from 'i18next';

import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';

type SalesReportChartPeriodControlProps = {
  period: ChartPeriodEnum;
  setPeriod: (period: ChartPeriodEnum) => void;
  t: TFunction<'translation', 'pages.reports.sales'>;
  variant?: 'v1' | 'v2';
};

const PERIOD_OPTIONS = (t: TFunction<'translation', 'pages.reports.sales'>) => [
  { value: ChartPeriodEnum.DAY, label: t('chart.controls.DAY') },
  { value: ChartPeriodEnum.WEEK, label: t('chart.controls.WEEK') },
  { value: ChartPeriodEnum.MONTH, label: t('chart.controls.MONTH') },
];

/**
 * Переключатель группировки графика: по дням / неделям / месяцам
 * @param props - текущий период и обработчик
 * @returns Radio.Group (v1) или Segmented (v2)
 */
export const SalesReportChartPeriodControl = ({
  period,
  setPeriod,
  t,
  variant = 'v1',
}: SalesReportChartPeriodControlProps) => {
  const options = PERIOD_OPTIONS(t);

  if (variant === 'v2') {
    return (
      <Segmented
        value={period}
        onChange={(value) => setPeriod(value as ChartPeriodEnum)}
        options={options}
      />
    );
  }

  return (
    <Radio.Group
      onChange={({ target }) => setPeriod(target.value)}
      value={period}
      optionType="button"
      buttonStyle="solid"
      options={options}
    />
  );
};
