const rasterImagePattern = /\.(jpe?g|png|webp|gif)(\?.*)?$/i;

/**
 * Проверяет, является ли src растровым изображением (не видео)
 * @param src - путь к файлу
 * @returns true для jpg/png/webp/gif
 */
export const isRasterProductImageSrc = (src: string): boolean => rasterImagePattern.test(src);
