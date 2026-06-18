import { buildMetaDescription } from '@/utilities/buildMetaDescription';

/**
 * Определяет MIME-тип изображения по расширению URL
 * @param imageUrl - абсолютный или относительный URL изображения
 * @returns MIME-тип или undefined
 */
const resolveImageMimeType = (imageUrl: string): string | undefined => {
  const lowerUrl = imageUrl.toLowerCase();

  if (lowerUrl.endsWith('.webp')) {
    return 'image/webp';
  }

  if (lowerUrl.endsWith('.png')) {
    return 'image/png';
  }

  if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
    return 'image/jpeg';
  }

  return undefined;
};

export {
  buildMetaDescription,
  resolveImageMimeType,
};
