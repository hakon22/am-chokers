import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { buildCatalogRouteHref } from '@/utilities/buildCatalogRouteHref';
import styles from '@/themes/v2/components/catalog/CatalogPagination.module.scss';

interface CatalogPaginationProps {
  currentPage: number;
  totalCount: number;
  pageSize: number;
}

/**
 * SSR-навигация пагинации каталога для краулеров
 */
export const CatalogPagination = ({ currentPage, totalCount, pageSize }: CatalogPaginationProps) => {
  const router = useRouter();
  const { t } = useTranslation('translation', { keyPrefix: 'pages.catalog.pagination' });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const pageHref = useMemo(() => (pageNumber: number) => buildCatalogRouteHref(router, {}, { pageNumber }), [router]);

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)
    .filter((pageNumber) => {
      if (totalPages <= 7) {
        return true;
      }

      return pageNumber === 1
        || pageNumber === totalPages
        || Math.abs(pageNumber - currentPage) <= 2;
    });

  return (
    <nav className={`${styles.pagination} ${styles.seoOnly}`} aria-label={t('ariaLabel')}>
      {currentPage > 1 && (
        <Link href={pageHref(currentPage - 1)} className={styles.pageLink}>
          {t('prev')}
        </Link>
      )}
      {pageNumbers.map((pageNumber, index) => {
        const previousPageNumber = pageNumbers[index - 1];
        const showEllipsis = previousPageNumber !== undefined && pageNumber - previousPageNumber > 1;

        return (
          <span key={pageNumber} className={styles.pageItem}>
            {showEllipsis && <span className={styles.ellipsis}>…</span>}
            <Link
              href={pageHref(pageNumber)}
              className={pageNumber === currentPage ? styles.pageLinkActive : styles.pageLink}
              aria-current={pageNumber === currentPage ? 'page' : undefined}
            >
              {pageNumber}
            </Link>
          </span>
        );
      })}
      {currentPage < totalPages && (
        <Link href={pageHref(currentPage + 1)} className={styles.pageLink}>
          {t('next')}
        </Link>
      )}
    </nav>
  );
};
