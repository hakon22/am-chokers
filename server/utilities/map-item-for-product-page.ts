import { isRasterProductImageSrc } from '@/utilities/getFirstRasterProductImageSrc';
import type { ItemEntity } from '@server/db/entities/item.entity';

export type ItemForProductPageInterface = ItemEntity & { hasTryOnImage: boolean; };

/**
 * Подготавливает товар для SSR страницы карточки: скрывает try_on URL, сохраняет флаг наличия
 * @param item - полный товар из Redis
 * @param options - includeTryOnImages: true для админа (полная галерея с try_on)
 * @returns товар без try_on images в галерее (кроме админа) и с hasTryOnImage
 */
export const mapItemForProductPage = (
  item: ItemEntity,
  options?: { includeTryOnImages?: boolean; },
): ItemForProductPageInterface => {
  const includeTryOnImages = options?.includeTryOnImages ?? false;
  const hasTryOnImage = item.images?.some((image) => image.tryOn && isRasterProductImageSrc(image.src)) ?? false;
  const images = includeTryOnImages
    ? (item.images ?? [])
    : (item.images?.filter((image) => !image.tryOn) ?? []);

  return {
    ...item,
    images,
    hasTryOnImage,
  } as ItemForProductPageInterface;
};
