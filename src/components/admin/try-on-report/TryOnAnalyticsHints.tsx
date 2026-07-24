import { QuestionCircleOutlined } from '@ant-design/icons';
import { Select, Tooltip } from 'antd';
import type { TFunction } from 'i18next';

type TryOnAttributionWindowSelectProps = {
  attributionWindowDays: number;
  attributionWindowOptions: readonly number[];
  setAttributionWindowDays: (value: number) => void;
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>;
  selectClassName?: string;
  labelRowClassName?: string;
  labelClassName?: string;
  hintIconClassName?: string;
};

/**
 * Селект окна атрибуции конверсии с подсказкой
 * @param props - значение, опции и обработчик смены
 * @returns JSX фильтра
 */
export const TryOnAttributionWindowSelect = ({
  attributionWindowDays,
  attributionWindowOptions,
  setAttributionWindowDays,
  t,
  selectClassName,
  labelRowClassName,
  labelClassName,
  hintIconClassName,
}: TryOnAttributionWindowSelectProps) => (
  <div className={selectClassName ?? 'w-100'}>
    <div className={labelRowClassName ?? 'd-flex align-items-center gap-1 mb-1'}>
      <span className={labelClassName ?? 'text-muted small'}>{t('filters.attributionWindowDays')}</span>
      <Tooltip title={t('filters.attributionWindowDaysHint')}>
        <QuestionCircleOutlined
          className={hintIconClassName}
          style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'help' }}
        />
      </Tooltip>
    </div>
    <Select
      className="w-100"
      value={attributionWindowDays}
      onChange={(value) => setAttributionWindowDays(value)}
      options={attributionWindowOptions.map((days) => ({
        value: days,
        label: t('filters.attributionWindowDaysValue', { days }),
      }))}
    />
  </div>
);

/**
 * Иконка подсказки для заголовка KPI
 * @param props - текст подсказки и опциональный класс иконки
 * @returns JSX иконки с tooltip
 */
export const TryOnAnalyticsHintIcon = ({
  title,
  className,
}: {
  title: string;
  className?: string;
}) => (
  <Tooltip title={title}>
    <QuestionCircleOutlined
      className={className}
      style={{ color: 'rgba(0, 0, 0, 0.45)', cursor: 'help', fontSize: 12 }}
    />
  </Tooltip>
);
