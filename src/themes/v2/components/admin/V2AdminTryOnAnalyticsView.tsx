import { useTranslation } from 'react-i18next';
import moment, { type Moment } from 'moment';
import { Card, Checkbox, DatePicker, Select, Space } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { AiTryOnVtoTypeEnum } from '@server/types/ai/enums/ai-try-on-vto-type.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { formatPreviousPeriodRangeLabel } from '@/components/admin/sales-report/salesReportChartData';
import { TryOnAnalyticsCharts } from '@/components/admin/try-on-report/TryOnAnalyticsCharts';
import { TryOnAnalyticsDetailsTables } from '@/components/admin/try-on-report/TryOnAnalyticsDetailsTables';
import { TryOnAnalyticsSummaryStats } from '@/components/admin/try-on-report/TryOnAnalyticsSummaryStats';
import { TryOnAttributionWindowSelect } from '@/components/admin/try-on-report/TryOnAnalyticsHints';
import styles from '@/themes/v2/components/admin/V2AdminTryOnAnalytics.module.scss';
import type { useTryOnAnalyticsReport } from '@/hooks/useTryOnAnalyticsReport';

const { RangePicker: MomentRangePicker } = DatePicker.generatePicker<Moment>(momentGenerateConfig);

type V2AdminTryOnAnalyticsViewProps = {
  reportState: ReturnType<typeof useTryOnAnalyticsReport>;
  lang: UserLangEnum;
};

/**
 * Представление вкладки аналитики AI-примерки для темы V2
 * @param props - состояние отчёта и язык
 * @returns JSX дашборда
 */
export const V2AdminTryOnAnalyticsView = ({ reportState, lang }: V2AdminTryOnAnalyticsViewProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reports.tryOn.analytics' });
  const { t: tRoot } = useTranslation('translation');

  const {
    data,
    from,
    to,
    period,
    vtoTypes,
    ignorePeriod,
    attributionWindowDays,
    attributionWindowOptions,
    setFrom,
    setTo,
    setPeriod,
    setVtoTypes,
    setIgnorePeriod,
    setAttributionWindowDays,
    chartData,
    fromParams,
    toParams,
  } = reportState;

  const showComparison = !ignorePeriod && !!data?.comparison;
  const previousPeriodRangeLabel = showComparison && from && to
    ? formatPreviousPeriodRangeLabel(from, to)
    : null;

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

  return (
    <div className={styles.report}>
      <Card className={styles.filtersCard}>
        <Space orientation="vertical" size="middle" className={styles.filtersSpace}>
          <div className={styles.filtersRow}>
            <div className={styles.periodField}>
              <div className={`${styles.filterLabelRow} ${styles.periodLabelRow}`}>
                <span className={styles.filterLabel}>{t('filters.period')}</span>
              </div>
              <Checkbox
                className={styles.periodCheckbox}
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
            </div>
            <div className={styles.vtoTypeSelect}>
              <div className={styles.filterLabelRow}>
                <span className={styles.filterLabel}>{t('filters.vtoType')}</span>
              </div>
              <Select
                mode="multiple"
                allowClear
                className="w-100"
                placeholder={t('filters.vtoTypeAll')}
                value={vtoTypes}
                onChange={(values) => setVtoTypes(values)}
                options={Object.values(AiTryOnVtoTypeEnum).map((type) => ({
                  value: type,
                  label: t(`vtoType.${type}`),
                }))}
              />
            </div>
            <TryOnAttributionWindowSelect
              attributionWindowDays={attributionWindowDays}
              attributionWindowOptions={attributionWindowOptions}
              setAttributionWindowDays={setAttributionWindowDays}
              t={t}
              selectClassName={styles.attributionWindowSelect}
              labelRowClassName={styles.filterLabelRow}
              labelClassName={styles.filterLabel}
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

          <TryOnAnalyticsSummaryStats
            summary={data.summary}
            conversion={data.conversion}
            changesPercent={data.comparison?.changesPercent}
            showComparison={showComparison}
            t={t}
            variant="v2"
            kpiRowClassName={styles.kpiRow}
            kpiCardClassName={styles.kpiCard}
            changeLabelClassName={styles.changeLabel}
            changeValuePositiveClassName={styles.changeValuePositive}
            changeValueNegativeClassName={styles.changeValueNegative}
            changeValueNeutralClassName={styles.changeValueNeutral}
            conversionCardClassName={styles.conversionCard}
          />

          <TryOnAnalyticsCharts
            chartData={chartData}
            period={period}
            setPeriod={setPeriod}
            statusFunnel={data.statusFunnel}
            variant="v2"
            chartCardClassName={styles.chartCard}
            chartControlsClassName={styles.chartControls}
            chartTotalsClassName={styles.chartTotals}
            funnelCardClassName={styles.chartCard}
            legendHiddenClassName={styles.legendHidden}
            secondaryChartsRowClassName={styles.secondaryChartsRow}
          />

          <TryOnAnalyticsDetailsTables
            topItems={data.topItems}
            byItemGroup={data.byItemGroup}
            byVtoType={data.byVtoType}
            byProvider={data.byProvider}
            validationRejections={data.validationRejections}
            conversionByItem={data.conversionByItem}
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
