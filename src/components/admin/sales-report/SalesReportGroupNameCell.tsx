import Link from 'next/link';

import salesReportTableStyles from '@/components/admin/sales-report/salesReportTable.module.scss';

type SalesReportGroupNameCellProps = {
  groupName: string;
  href?: string;
};

/**
 * Ячейка таблицы с названием группы товаров
 * @param props - название группы и опциональная ссылка в каталог
 * @returns содержимое колонки «Группа»
 */
export const SalesReportGroupNameCell = ({ groupName, href }: SalesReportGroupNameCellProps) => {
  if (!href) {
    return <span>{groupName}</span>;
  }

  return (
    <Link href={href} className={salesReportTableStyles.groupNameLink}>
      {groupName}
    </Link>
  );
};
