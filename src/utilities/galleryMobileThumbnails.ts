const MOBILE_THUMBNAIL_SIZE_SMALL = 80;
const MOBILE_THUMBNAIL_SIZE_DEFAULT = 96;
const MOBILE_THUMBNAIL_GAP = 2;
const MOBILE_THUMBNAIL_PADDING = 8;
const MOBILE_THUMBNAIL_SMALL_BREAKPOINT = 768;

export type ShouldDisableMobileThumbnailSwipeParams = {
  isMobile: boolean;
  imageCount: number;
  galleryHeightPx: number;
  viewportWidth: number;
};

/**
 * Считает суммарную высоту вертикального стека миниатюр на мобиле
 * @param imageCount - количество изображений в галерее
 * @param viewportWidth - ширина viewport в px
 * @returns высота стека миниатюр в px
 */
export const computeMobileThumbnailStackHeight = (imageCount: number, viewportWidth: number): number => {
  if (imageCount <= 0) {
    return 0;
  }

  const thumbnailSize = viewportWidth <= MOBILE_THUMBNAIL_SMALL_BREAKPOINT
    ? MOBILE_THUMBNAIL_SIZE_SMALL
    : MOBILE_THUMBNAIL_SIZE_DEFAULT;
  const gapTotal = Math.max(0, imageCount - 1) * MOBILE_THUMBNAIL_GAP;

  return imageCount * thumbnailSize + gapTotal + MOBILE_THUMBNAIL_PADDING;
};

/**
 * Определяет, нужно ли отключить свайп миниатюр (все превью помещаются в высоту слайда)
 * @param params - isMobile, imageCount, galleryHeightPx, viewportWidth
 * @returns true, если свайп миниатюр не нужен
 */
export const shouldDisableMobileThumbnailSwipe = ({
  isMobile,
  imageCount,
  galleryHeightPx,
  viewportWidth,
}: ShouldDisableMobileThumbnailSwipeParams): boolean => {
  if (!isMobile || imageCount < 2) {
    return false;
  }

  const stackHeight = computeMobileThumbnailStackHeight(imageCount, viewportWidth);

  return stackHeight <= galleryHeightPx;
};
