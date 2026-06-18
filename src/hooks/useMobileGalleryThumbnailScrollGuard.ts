import { useEffect, type RefObject } from 'react';

const THUMBNAILS_RIGHT_WRAPPER_SELECTOR = '.image-gallery-thumbnails-wrapper.image-gallery-thumbnails-right';
const THUMBNAILS_CONTAINER_SELECTOR = '.image-gallery-thumbnails-container';
const THUMBNAIL_SELECTOR = '.image-gallery-thumbnail';

/**
 * Извлекает translateY из inline transform (translate / translate3d)
 * @param transformValue - значение CSS transform
 * @returns смещение по Y в px или 0
 */
const parseTranslateYFromTransform = (transformValue: string): number => {
  if (!transformValue || transformValue === 'none') {
    return 0;
  }

  const translate3dMatch = transformValue.match(/translate3d\([^,]+,\s*(-?[\d.]+)px/i);
  if (translate3dMatch) {
    return parseFloat(translate3dMatch[1]);
  }

  const translateMatch = transformValue.match(/translate\([^,]+,\s*(-?[\d.]+)px/i);
  if (translateMatch) {
    return parseFloat(translateMatch[1]);
  }

  const translateYMatch = transformValue.match(/translateY\((-?[\d.]+)px\)/i);
  if (translateYMatch) {
    return parseFloat(translateYMatch[1]);
  }

  return 0;
};

/**
 * Проверяет, пересекается ли rect элемента с rect обёртки
 * @param elementRect - границы элемента
 * @param wrapperRect - границы обёртки миниатюр
 * @returns true, если есть видимое пересечение
 */
const isRectIntersectingWrapper = (elementRect: DOMRect, wrapperRect: DOMRect): boolean => (
  elementRect.bottom > wrapperRect.top
  && elementRect.top < wrapperRect.bottom
);

/**
 * Кратковременно меняет height обёртки, чтобы сработал ResizeObserver react-image-gallery
 * @param wrapperElement - DOM-элемент обёртки миниатюр
 */
const nudgeThumbnailWrapperResizeObserver = (wrapperElement: HTMLElement): void => {
  const previousHeight = wrapperElement.style.height;
  const currentHeight = wrapperElement.offsetHeight;

  if (currentHeight <= 0) {
    return;
  }

  wrapperElement.style.height = `${currentHeight - 1}px`;
  void wrapperElement.offsetHeight;
  wrapperElement.style.height = previousHeight;
};

/**
 * Ограничивает translateY трека миниатюр допустимым диапазоном
 * @param containerElement - контейнер с transform
 * @param wrapperElement - обёртка миниатюр
 * @returns true, если transform был скорректирован
 */
const clampThumbnailContainerTransform = (containerElement: HTMLElement, wrapperElement: HTMLElement): boolean => {
  const wrapperHeight = wrapperElement.clientHeight;
  const contentHeight = containerElement.scrollHeight;
  const maxScroll = Math.max(0, contentHeight - wrapperHeight);

  const currentTranslateY = parseTranslateYFromTransform(containerElement.style.transform);
  const clampedTranslateY = Math.min(0, Math.max(-maxScroll, currentTranslateY));

  if (clampedTranslateY === currentTranslateY) {
    return false;
  }

  containerElement.style.transform = `translate3d(0, ${clampedTranslateY}px, 0)`;
  return true;
};

/**
 * Проверяет видимость миниатюр и при необходимости сбрасывает позицию трека
 * @param galleryRootElement - корневой элемент галереи
 */
const guardMobileThumbnailScroll = (galleryRootElement: HTMLElement): void => {
  const fullscreenContent = galleryRootElement.querySelector('.image-gallery-content.fullscreen');
  if (fullscreenContent) {
    return;
  }

  const wrapperElement = galleryRootElement.querySelector(THUMBNAILS_RIGHT_WRAPPER_SELECTOR) as HTMLElement | null;
  const containerElement = galleryRootElement.querySelector(THUMBNAILS_CONTAINER_SELECTOR) as HTMLElement | null;

  if (!wrapperElement || !containerElement) {
    return;
  }

  const wrapperRect = wrapperElement.getBoundingClientRect();
  const thumbnailElements = wrapperElement.querySelectorAll(THUMBNAIL_SELECTOR);
  const hasVisibleThumbnail = Array.from(thumbnailElements).some((thumbnailElement) => {
    return isRectIntersectingWrapper(thumbnailElement.getBoundingClientRect(), wrapperRect);
  });

  const wasClamped = clampThumbnailContainerTransform(containerElement, wrapperElement);

  if (!hasVisibleThumbnail || wasClamped) {
    nudgeThumbnailWrapperResizeObserver(wrapperElement);
  }
};

export type UseMobileGalleryThumbnailScrollGuardParams = {
  galleryRootRef: RefObject<HTMLElement | null>;
  isMobile: boolean;
  isFullscreen?: boolean;
  showThumbnails?: boolean;
  layoutKey?: string | number;
};

/**
 * Страховка от перескролла миниатюр на мобиле: clamp transform после touchend/touchcancel
 * @param params - galleryRootRef, isMobile, isFullscreen, showThumbnails, layoutKey
 */
export const useMobileGalleryThumbnailScrollGuard = ({
  galleryRootRef,
  isMobile,
  isFullscreen = false,
  showThumbnails = true,
  layoutKey,
}: UseMobileGalleryThumbnailScrollGuardParams): void => {
  useEffect(() => {
    if (!isMobile || isFullscreen || !showThumbnails) {
      return;
    }

    const galleryRootElement = galleryRootRef.current;
    if (!galleryRootElement) {
      return;
    }

    const wrapperElement = galleryRootElement.querySelector(THUMBNAILS_RIGHT_WRAPPER_SELECTOR) as HTMLElement | null;
    if (!wrapperElement) {
      return;
    }

    const handleTouchEnd = () => {
      requestAnimationFrame(() => {
        guardMobileThumbnailScroll(galleryRootElement);
      });
    };

    wrapperElement.addEventListener('touchend', handleTouchEnd, { passive: true });
    wrapperElement.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      wrapperElement.removeEventListener('touchend', handleTouchEnd);
      wrapperElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [galleryRootRef, isMobile, isFullscreen, showThumbnails, layoutKey]);
};
