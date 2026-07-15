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
 * Возвращает src первого растрового изображения товара для SEO (OG, preload, JSON-LD)
 * @param images - изображения товара
 * @returns путь к файлу или undefined
 */
export const getFirstRasterProductImageSrc = (images: ProductImageInterface[]): string | undefined => {
  const sortedImages = sortItemImagesByOrder(images);
  const rasterImage = sortedImages.find(({ src, tryOn }) => !tryOn && isRasterProductImageSrc(src));

  return rasterImage?.src;
};
