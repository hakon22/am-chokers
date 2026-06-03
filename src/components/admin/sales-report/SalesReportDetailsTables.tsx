import { Card, Table, Tabs } from 'antd';
import type { TFunction } from 'i18next';

import { buildAntTableLocale } from '@/utilities/build-ant-table-locale';
import { buildRevenueByItemGroupColumns, buildTopProductsColumns, buildTopPromosColumns } from '@/components/admin/sales-report/salesReportTableColumns';
import salesReportTableStyles from '@/components/admin/sales-report/salesReportTable.module.scss';
import type { SalesRevenueByItemGroupInterface } from '@server/types/reports/sales/sales-revenue-by-item-group.interface';
import type { SalesTopProductInterface } from '@server/types/reports/sales/sales-top-product.interface';
import type { SalesTopPromoInterface } from '@server/types/reports/sales/sales-top-promo.interface';

type SalesReportDetailsTablesProps = {
  topProducts: SalesTopProductInterface[];
  topPromos: SalesTopPromoInterface[];
  revenueByItemGroup: SalesRevenueByItemGroupInterface[];
  t: TFunction<'translation', 'pages.reports.sales'>;
  tRoot?: TFunction<'translation'>;
  variant?: 'v1' | 'v2';
  tableClassName?: string;
  cardClassName?: string;
};

/**
 * Блок детализации продаж с табами: топ товаров, промокоды, группы
 * @param props - данные таблиц и настройки отображения
 * @returns сгруппированные таблицы отчёта
 */
export const SalesReportDetailsTables = ({
  topProducts,
  topPromos,
  revenueByItemGroup,
  t,
  tRoot,
  variant = 'v1',
  tableClassName,
  cardClassName,
}: SalesReportDetailsTablesProps) => {
  const tableLocale = tRoot ? buildAntTableLocale(tRoot) : undefined;
  const resolvedTableClassName = [salesReportTableStyles.table, tableClassName].filter(Boolean).join(' ');

  const tabItems = [
    {
      key: 'products',
      label: t('table.topProductsTitle'),
      children: (
        <Table
          rowKey="itemId"
          dataSource={topProducts}
          columns={buildTopProductsColumns(t)}
          pagination={false}
          scroll={{ x: true }}
          className={resolvedTableClassName}
          locale={tableLocale}
        />
      ),
    },
    {
      key: 'promos',
      label: t('table.topPromosTitle'),
      children: (
        <Table
          rowKey="promotionalId"
          dataSource={topPromos}
          columns={buildTopPromosColumns(t)}
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
          dataSource={revenueByItemGroup}
          columns={buildRevenueByItemGroupColumns(t)}
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
    <div className="mt-4">
      <h3 className="mb-3 fs-4">{t('table.detailsTitle')}</h3>
      {tabs}
    </div>
  );
};
