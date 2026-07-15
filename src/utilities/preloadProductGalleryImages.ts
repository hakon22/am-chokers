import { getMediaSourceKey, markMediaSourceLoaded } from '@/themes/v2/components/mediaLoadCache';
import { buildProductGallerySlideOptimizerUrl, buildProductGalleryThumbnailOptimizerUrl } from '@/utilities/buildNextImageOptimizerUrl';
import { getProductGalleryRasterImageSrcs } from '@/utilities/getFirstRasterProductImageSrc';

interface ProductImageInterface {
  src: string;
  order?: number | null;
  tryOn?: boolean;
}

/** Полные optimizer URL, для которых уже запущен или завершён прогрев */
const startedGalleryOptimizerPreloads = new Set<string>();

/**
 * Прогревает один optimizer URL; опционально отмечает сырой src в mediaLoadCache
 * @param optimizerUrl - URL /_next/image?...
 * @param rawImageSrc - сырой src для mediaLoadCache (только после slide warmup)
 * @param markRawSourceLoaded - помечать mediaLoadCache после успешной загрузки
 */
const preloadOptimizerImage = (optimizerUrl: string, rawImageSrc: string, markRawSourceLoaded: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  if (startedGalleryOptimizerPreloads.has(optimizerUrl)) {
    return;
  }

  startedGalleryOptimizerPreloads.add(optimizerUrl);

  const imageElement = new window.Image();
  imageElement.decoding = 'async';

  /**
   * После успешного decode помечает сырой источник (для скелетона V2Image)
   */
  const finishPreload = () => {
    if (markRawSourceLoaded) {
      markMediaSourceLoaded(getMediaSourceKey(rawImageSrc));
    }
  };

  imageElement.onload = finishPreload;
  imageElement.onerror = () => {
    startedGalleryOptimizerPreloads.delete(optimizerUrl);
  };
  imageElement.src = optimizerUrl;

  if (imageElement.complete && imageElement.naturalWidth > 0) {
    finishPreload();
  }
};

/**
 * Прогревает slide + thumb /_next/image для всех растровых фото галереи
 * @param images - изображения товара или уже отфильтрованный список сырых src
 */
export const preloadProductGalleryImages = (images: ProductImageInterface[] | string[]): void => {
  if (typeof window === 'undefined') {
    return;
  }

  const imageSources = typeof images[0] === 'string'
    ? [...new Set(images as string[])]
    : getProductGalleryRasterImageSrcs(images as ProductImageInterface[]);

  const viewportOptions = {
    viewportWidth: window.innerWidth,
    devicePixelRatio: window.devicePixelRatio || 1,
  };

  imageSources.forEach((imageSrc) => {
    const slideOptimizerUrl = buildProductGallerySlideOptimizerUrl(imageSrc, viewportOptions);
    const thumbnailOptimizerUrl = buildProductGalleryThumbnailOptimizerUrl(imageSrc, viewportOptions);

    preloadOptimizerImage(slideOptimizerUrl, imageSrc, true);
    preloadOptimizerImage(thumbnailOptimizerUrl, imageSrc, false);
  });
};
