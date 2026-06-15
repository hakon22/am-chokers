import { Radio, Segmented } from 'antd';
import type { TFunction } from 'i18next';

import { ChartPeriodEnum } from '@server/types/reports/enums/chart-period.enum';

type AdminChartPeriodControlProps = {
  period: ChartPeriodEnum;
  setPeriod: (period: ChartPeriodEnum) => void;
  t: TFunction<'translation'>;
  variant?: 'v1' | 'v2';
};

/**
 * Возвращает подписи переключателя группировки графика
 * @param t - функция перевода с ключами chart.controls
 * @returns опции для Segmented / Radio.Group
 */
const buildPeriodOptions = (t: TFunction<'translation'>) => [
  { value: ChartPeriodEnum.DAY, label: t('chart.controls.DAY') },
  { value: ChartPeriodEnum.WEEK, label: t('chart.controls.WEEK') },
  { value: ChartPeriodEnum.MONTH, label: t('chart.controls.MONTH') },
];

/**
 * Переключатель группировки графика: по дням / неделям / месяцам
 * @param props - текущий период, обработчик и вариант оформления
 * @returns Radio.Group (v1) или Segmented (v2)
 */
export const AdminChartPeriodControl = ({
  period,
  setPeriod,
  t,
  variant = 'v1',
}: AdminChartPeriodControlProps) => {
  const options = buildPeriodOptions(t);

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
