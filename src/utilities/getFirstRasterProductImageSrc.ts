import { sortItemImagesByOrder } from '@/utilities/sortItemImagesByOrder';

interface ProductImageInterface {
  src: string;
  order?: number | null;
  tryOn?: boolean;
}

const rasterImagePattern = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;

/**
 * Проверяет, является ли src растровым изображением (не видео)
 * @param src - путь к файлу
 * @returns true для jpg/png/webp/gif
 */
export const isRasterProductImageSrc = (src: string): boolean => rasterImagePattern.test(src);

/**
 * Возвращает src всех растровых фото галереи (без try-on и видео), в порядке order
 * @param images - изображения товара
 * @returns уникальные пути к файлам
 */
export const getProductGalleryRasterImageSrcs = (images: ProductImageInterface[]): string[] => {
  const sortedImages = sortItemImagesByOrder(images);
  const seenSources = new Set<string>();
  const rasterImageSources: string[] = [];

  sortedImages.forEach(({ src, tryOn }) => {
    if (tryOn || !isRasterProductImageSrc(src) || seenSources.has(src)) {
      return;
    }
    seenSources.add(src);
    rasterImageSources.push(src);
  });

  return rasterImageSources;
};

/**
 * Возвращает src первого растрового изображения товара для SEO (OG, preload, JSON-LD)
 * @param images - изображения товара
 * @returns путь к файлу или undefined
 */
export const getFirstRasterProductImageSrc = (images: ProductImageInterface[]): string | undefined => (
  getProductGalleryRasterImageSrcs(images)[0]
);
