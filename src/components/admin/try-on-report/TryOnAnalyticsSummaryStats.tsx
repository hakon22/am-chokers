import { Card, Col, Row, Statistic } from 'antd';
import type { TFunction } from 'i18next';

import {
  formatTryOnChangePercentLabel,
  formatTryOnDurationSeconds,
  getTryOnComparisonChangeTone,
} from '@/components/admin/try-on-report/tryOnReportChartData';
import { TryOnAnalyticsHintIcon } from '@/components/admin/try-on-report/TryOnAnalyticsHints';
import type { TryOnAnalyticsSummaryInterface } from '@server/types/reports/try-on/try-on-analytics-summary.interface';
import type { TryOnAnalyticsSummaryChangesPercentInterface } from '@server/types/reports/try-on/try-on-analytics-comparison.interface';
import type { TryOnConversionSummaryInterface } from '@server/types/reports/try-on/try-on-conversion-summary.interface';

type SummaryMetricConfig = {
  key: keyof TryOnAnalyticsSummaryInterface;
  suffix?: string;
  isDuration?: boolean;
};

const SUMMARY_METRICS: SummaryMetricConfig[] = [
  { key: 'totalRequestsCount' },
  { key: 'successfulTryOnsCount' },
  { key: 'successRate', suffix: '%' },
  { key: 'validationRejectedCount' },
  { key: 'generationFailedCount' },
  { key: 'averageDurationMs', isDuration: true },
  { key: 'totalAiCost', suffix: '₽' },
  { key: 'averageSuccessCost', suffix: '₽' },
  { key: 'ratingsCount' },
  { key: 'positiveRatingRate', suffix: '%' },
];

const CONVERSION_METRICS: (keyof TryOnConversionSummaryInterface)[] = [
  'eligibleTryOnsCount',
  'convertedTryOnsCount',
  'tryOnToPurchaseRate',
  'uniqueBuyersAfterTryOnCount',
  'attributedRevenue',
  'attributedAiCost',
  'returnOnAiSpend',
];

type TryOnAnalyticsSummaryStatsProps = {
  summary: TryOnAnalyticsSummaryInterface;
  conversion: TryOnConversionSummaryInterface;
  changesPercent?: TryOnAnalyticsSummaryChangesPercentInterface | null;
  showComparison: boolean;
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>;
  variant?: 'v1' | 'v2';
  kpiRowClassName?: string;
  kpiCardClassName?: string;
  changeLabelClassName?: string;
  changeValuePositiveClassName?: string;
  changeValueNegativeClassName?: string;
  changeValueNeutralClassName?: string;
  conversionCardClassName?: string;
};

/**
 * Отображает KPI аналитики AI-примерки и блок конверсии
 * @param props - summary, conversion и сравнение с предыдущим периодом
 * @returns блок Statistic
 */
export const TryOnAnalyticsSummaryStats = ({
  summary,
  conversion,
  changesPercent,
  showComparison,
  t,
  variant = 'v1',
  kpiRowClassName,
  kpiCardClassName,
  changeLabelClassName,
  changeValuePositiveClassName,
  changeValueNegativeClassName,
  changeValueNeutralClassName,
  conversionCardClassName,
}: TryOnAnalyticsSummaryStatsProps) => {
  const changeToneClassNames = {
    positive: changeValuePositiveClassName ?? 'text-success',
    negative: changeValueNegativeClassName ?? 'text-danger',
    neutral: changeValueNeutralClassName ?? 'text-muted',
  } as const;

  /**
   * Рендерит подпись сравнения с предыдущим периодом
   * @param metricKey - ключ KPI
   * @param changePercent - процент изменения
   * @returns JSX или null
   */
  const renderChangeLabel = (
    metricKey: keyof TryOnAnalyticsSummaryChangesPercentInterface,
    changePercent: number | null | undefined,
  ) => {
    const changeLabel = showComparison && changesPercent
      ? formatTryOnChangePercentLabel(changePercent, t)
      : null;

    if (!changeLabel) {
      return null;
    }

    const changeTone = getTryOnComparisonChangeTone(metricKey, changePercent);
    const toneClassName = variant === 'v2'
      ? changeToneClassNames[changeTone]
      : (changeTone === 'positive' ? 'text-success' : changeTone === 'negative' ? 'text-danger' : 'text-muted');

    if (variant === 'v2' && changeLabelClassName) {
      return (
        <span className={changeLabelClassName}>
          <span className={toneClassName}>{changeLabel}</span>
          {' '}
          {t('comparison.vsPreviousPeriod')}
        </span>
      );
    }

    return (
      <small className={`${toneClassName} d-block`}>
        {changeLabel} {t('comparison.vsPreviousPeriod')}
      </small>
    );
  };

  /**
   * Рендерит одну KPI-метрику summary
   * @param config - конфигурация метрики
   * @returns JSX ячейки KPI
   */
  const renderSummaryMetric = ({ key, suffix, isDuration }: SummaryMetricConfig) => {
    const rawValue = summary[key];
    const displayValue = isDuration
      ? formatTryOnDurationSeconds(rawValue, t)
      : rawValue;
    const changePercent = changesPercent?.[key];

    const statistic = (
      <>
        <Statistic
          title={t(`summary.${key}`)}
          value={displayValue}
          suffix={isDuration ? undefined : suffix}
        />
        {renderChangeLabel(key, changePercent)}
      </>
    );

    if (variant === 'v2' && kpiCardClassName) {
      return (
        <Col key={key} xs={24} sm={12} md={8} lg={6}>
          <Card className={kpiCardClassName}>
            {statistic}
          </Card>
        </Col>
      );
    }

    return (
      <Col key={key} xs={24} sm={12} md={8} lg={6}>
        {statistic}
      </Col>
    );
  };

  /**
   * Рендерит заголовок KPI с опциональной подсказкой
   * @param metricKey - ключ метрики
   * @param translationKey - ключ i18n заголовка
   * @returns JSX заголовка
   */
  const renderMetricTitle = (metricKey: string, translationKey: string) => {
    const hintKey = `${metricKey}Hint`;
    const hint = t(`conversion.${hintKey}`, { defaultValue: '' });

    if (!hint) {
      return t(translationKey);
    }

    return (
      <span className="d-inline-flex align-items-center gap-1">
        {t(translationKey)}
        <TryOnAnalyticsHintIcon title={hint} />
      </span>
    );
  };

  /**
   * Рендерит одну KPI-метрику конверсии
   * @param key - ключ метрики конверсии
   * @returns JSX ячейки KPI
   */
  const renderConversionMetric = (key: keyof TryOnConversionSummaryInterface) => {
    const rawValue = conversion[key];
    const suffix = key === 'tryOnToPurchaseRate'
      ? '%'
      : ['attributedRevenue', 'attributedAiCost'].includes(key)
        ? '₽'
        : undefined;

    const statistic = (
      <Statistic
        title={renderMetricTitle(key, `conversion.${key}`)}
        value={rawValue ?? '—'}
        suffix={suffix}
      />
    );

    if (variant === 'v2' && kpiCardClassName) {
      return (
        <Col key={key} xs={24} sm={12} md={8} lg={6}>
          <Card className={kpiCardClassName}>
            {statistic}
          </Card>
        </Col>
      );
    }

    return (
      <Col key={key} xs={24} sm={12} md={8} lg={6}>
        {statistic}
      </Col>
    );
  };

  const conversionContent = (
    <>
      <p className="text-muted mb-3">{t('loggedInOnlyDisclaimer')}</p>
      <Row gutter={[16, 16]} className={kpiRowClassName}>
        {CONVERSION_METRICS.map((key) => renderConversionMetric(key))}
      </Row>
    </>
  );

  return (
    <>
      <Row gutter={[16, 16]} className={kpiRowClassName ?? 'mb-4'}>
        {SUMMARY_METRICS.map((metricConfig) => renderSummaryMetric(metricConfig))}
      </Row>

      {variant === 'v2' && conversionCardClassName ? (
        <Card className={conversionCardClassName} title={t('conversion.title')}>
          {conversionContent}
        </Card>
      ) : (
        <Card className="mt-4 mb-4" title={t('conversion.title')}>
          {conversionContent}
        </Card>
      )}
    </>
  );
};
