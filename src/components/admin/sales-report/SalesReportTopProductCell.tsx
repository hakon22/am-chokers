import Image from 'next/image';

import salesReportTableStyles from '@/components/admin/sales-report/salesReportTable.module.scss';

type SalesReportTopProductCellProps = {
  itemName: string;
  itemImageSrc: string | null;
};

/**
 * Проверяет, что URL указывает на видеофайл
 * @param source - путь к медиафайлу
 * @returns true для mp4
 */
const isVideoSource = (source: string): boolean => /\.mp4$/i.test(source);

/**
 * Ячейка таблицы топ товаров: миниатюра и название
 * @param props - название и URL первого медиафайла
 * @returns содержимое колонки «Товар»
 */
export const SalesReportTopProductCell = ({ itemName, itemImageSrc }: SalesReportTopProductCellProps) => (
  <div className={salesReportTableStyles.productCell}>
    {itemImageSrc && (
      isVideoSource(itemImageSrc) ? (
        <video
          src={itemImageSrc}
          autoPlay
          loop
          muted
          playsInline
          className={salesReportTableStyles.productImage}
        />
      ) : (
        <Image
          src={itemImageSrc}
          alt={itemName}
          width={48}
          height={48}
          unoptimized
          className={salesReportTableStyles.productImage}
        />
      )
    )}
    <span className={salesReportTableStyles.productName}>{itemName}</span>
  </div>
);
