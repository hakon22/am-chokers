import { Card, Table, Tabs } from 'antd';
import type { TFunction } from 'i18next';

import { buildAntTableLocale } from '@/utilities/build-ant-table-locale';
import {
  buildTryOnByGroupColumns,
  buildTryOnByProviderColumns,
  buildTryOnByVtoTypeColumns,
  buildTryOnConversionColumns,
  buildTryOnRejectionsColumns,
  buildTryOnTopItemsColumns,
} from '@/components/admin/try-on-report/tryOnReportTableColumns';
import salesReportTableStyles from '@/components/admin/sales-report/salesReportTable.module.scss';
import type { TryOnAnalyticsReportInterface } from '@server/types/reports/try-on/try-on-analytics-report.interface';

type TryOnAnalyticsDetailsTablesProps = {
  topItems: TryOnAnalyticsReportInterface['topItems'];
  byItemGroup: TryOnAnalyticsReportInterface['byItemGroup'];
  byVtoType: TryOnAnalyticsReportInterface['byVtoType'];
  byProvider: TryOnAnalyticsReportInterface['byProvider'];
  validationRejections: TryOnAnalyticsReportInterface['validationRejections'];
  conversionByItem: TryOnAnalyticsReportInterface['conversionByItem'];
  t: TFunction<'translation', 'pages.reports.tryOn.analytics'>;
  tRoot?: TFunction<'translation'>;
  variant?: 'v1' | 'v2';
  tableClassName?: string;
  cardClassName?: string;
};

/**
 * Блок детализации аналитики AI-примерки с табами
 * @param props - данные таблиц и настройки отображения
 * @returns сгруппированные таблицы отчёта
 */
export const TryOnAnalyticsDetailsTables = ({
  topItems,
  byItemGroup,
  byVtoType,
  byProvider,
  validationRejections,
  conversionByItem,
  t,
  tRoot,
  variant = 'v1',
  tableClassName,
  cardClassName,
}: TryOnAnalyticsDetailsTablesProps) => {
  const tableLocale = tRoot ? buildAntTableLocale(tRoot) : undefined;
  const resolvedTableClassName = [salesReportTableStyles.table, tableClassName].filter(Boolean).join(' ');

  const tabItems = [
    {
      key: 'topItems',
      label: t('table.topItemsTitle'),
      children: (
        <Table
          rowKey="itemId"
          dataSource={topItems}
          columns={buildTryOnTopItemsColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'groups',
      label: t('table.byGroupTitle'),
      children: (
        <Table
          rowKey="groupId"
          dataSource={byItemGroup}
          columns={buildTryOnByGroupColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'vtoType',
      label: t('table.byVtoTypeTitle'),
      children: (
        <Table
          rowKey="vtoType"
          dataSource={byVtoType}
          columns={buildTryOnByVtoTypeColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'provider',
      label: t('table.byProviderTitle'),
      children: (
        <Table
          rowKey="provider"
          dataSource={byProvider}
          columns={buildTryOnByProviderColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'rejections',
      label: t('table.rejectionsTitle'),
      children: (
        <Table
          rowKey="reason"
          dataSource={validationRejections}
          columns={buildTryOnRejectionsColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'conversion',
      label: t('table.conversionTitle'),
      children: (
        <Table
          rowKey="itemId"
          dataSource={conversionByItem}
          columns={buildTryOnConversionColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
  ];

  const tabs = <Tabs items={tabItems} />;

  if (variant === 'v2') {
    return (
      <Card className={cardClassName} title={t('table.detailsTitle')}>
        {tabs}
      </Card>
    );
  }

  return (
    <Card className="mt-4" title={t('table.detailsTitle')}>
      {tabs}
    </Card>
  );
};
