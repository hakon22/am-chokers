import { useLayoutEffect, useRef, type RefObject } from 'react';

const FOOTER_OFFSET_GAP = 16;

interface CatalogFilterAffixResult {
  placeholderRef: RefObject<HTMLDivElement | null>;
  panelRef: RefObject<HTMLDivElement | null>;
}

/**
 * Сбрасывает inline-стили affix у placeholder и панели
 * @param placeholderElement - элемент-заглушка в grid
 * @param panelElement - панель фильтров
 */
const resetAffixStyles = (placeholderElement: HTMLDivElement, panelElement: HTMLDivElement): void => {
  placeholderElement.style.height = '';
  panelElement.style.position = '';
  panelElement.style.top = '';
  panelElement.style.left = '';
  panelElement.style.width = '';
  panelElement.style.zIndex = '';
};

/**
 * Фиксирует панель фильтров при скролле; плавно останавливает у footer и конца колонки
 * @param offsetTop - отступ панели от верха viewport в обычном affix
 * @returns refs для placeholder и панели
 */
export const useCatalogFilterAffix = (offsetTop: number): CatalogFilterAffixResult => {
  const placeholderRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    /**
     * Пересчитывает fixed-позицию без React re-render (один Math.min — без скачков режима)
     */
    const applyAffixPosition = (): void => {
      const placeholderElement = placeholderRef.current;
      const panelElement = panelRef.current;

      if (!placeholderElement || !panelElement) {
        return;
      }

      const panelHeight = panelElement.offsetHeight;
      const placeholderTop = placeholderElement.getBoundingClientRect().top;
      const shouldFix = placeholderTop <= offsetTop;

      if (!shouldFix) {
        resetAffixStyles(placeholderElement, panelElement);
        return;
      }

      // Сначала резервируем высоту, чтобы placeholder не схлопывался после position: fixed
      placeholderElement.style.height = `${panelHeight}px`;

      const placeholderRect = placeholderElement.getBoundingClientRect();
      const productsColumn = placeholderElement.nextElementSibling;
      const columnBottom = productsColumn
        ? productsColumn.getBoundingClientRect().bottom
        : placeholderRect.bottom;

      const footerElement = document.querySelector('.v2-app footer');
      const footerTop = footerElement
        ? footerElement.getBoundingClientRect().top
        : window.innerHeight;

      const footerCapTop = footerTop - panelHeight - FOOTER_OFFSET_GAP;
      const columnEndTop = columnBottom - panelHeight;
      const top = Math.min(offsetTop, footerCapTop, columnEndTop);

      panelElement.style.position = 'fixed';
      panelElement.style.top = `${top}px`;
      panelElement.style.left = `${placeholderRect.left}px`;
      panelElement.style.width = `${placeholderRect.width}px`;
      panelElement.style.zIndex = '10';
    };

    /**
     * Планирует пересчёт позиции в следующем animation frame
     */
    const scheduleAffixUpdate = (): void => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        animationFrameRef.current = null;
        applyAffixPosition();
      });
    };

    applyAffixPosition();

    window.addEventListener('scroll', scheduleAffixUpdate, { passive: true });
    window.addEventListener('resize', scheduleAffixUpdate);

    const resizeObserver = new ResizeObserver(scheduleAffixUpdate);
    const panelElement = panelRef.current;

    if (panelElement) {
      resizeObserver.observe(panelElement);
    }

    return () => {
      window.removeEventListener('scroll', scheduleAffixUpdate);
      window.removeEventListener('resize', scheduleAffixUpdate);
      resizeObserver.disconnect();

      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (placeholderRef.current && panelRef.current) {
        resetAffixStyles(placeholderRef.current, panelRef.current);
      }
    };
  }, [offsetTop]);

  return { placeholderRef, panelRef };
};
