import Image from 'next/image';
import Link from 'next/link';

import salesReportTableStyles from '@/components/admin/sales-report/salesReportTable.module.scss';

type SalesReportTopProductCellProps = {
  itemName: string;
  itemImageSrc: string | null;
  href?: string;
};

/**
 * Проверяет, что URL указывает на видеофайл
 * @param source - путь к медиафайлу
 * @returns true для mp4
 */
const isVideoSource = (source: string): boolean => /\.mp4$/i.test(source);

/**
 * Рендерит миниатюру товара для ячейки таблицы
 * @param props - название, URL медиа и опциональная ссылка
 * @returns JSX миниатюры
 */
const renderProductThumbnail = ({ itemName, itemImageSrc }: Pick<SalesReportTopProductCellProps, 'itemName' | 'itemImageSrc'>) => {
  if (!itemImageSrc) {
    return null;
  }

  if (isVideoSource(itemImageSrc)) {
    return (
      <video
        src={itemImageSrc}
        autoPlay
        loop
        muted
        playsInline
        className={salesReportTableStyles.productImage}
      />
    );
  }

  return (
    <Image
      src={itemImageSrc}
      alt={itemName}
      width={48}
      height={48}
      unoptimized
      className={salesReportTableStyles.productImage}
    />
  );
};

/**
 * Ячейка таблицы топ товаров: миниатюра и название
 * @param props - название, URL первого медиафайла и опциональная ссылка в каталог
 * @returns содержимое колонки «Товар»
 */
export const SalesReportTopProductCell = ({ itemName, itemImageSrc, href }: SalesReportTopProductCellProps) => {
  const content = (
    <>
      {renderProductThumbnail({ itemName, itemImageSrc })}
      <span className={salesReportTableStyles.productName}>{itemName}</span>
    </>
  );

  if (!href) {
    return (
      <div className={salesReportTableStyles.productCell}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={salesReportTableStyles.productCellLink}>
      <div className={salesReportTableStyles.productCell}>
        {content}
      </div>
    </Link>
  );
};
