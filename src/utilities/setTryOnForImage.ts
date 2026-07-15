import type { ImageEntity } from '@server/db/entities/image.entity';

/**
 * Возвращает копию изображения с обновлёнными полями
 * @param image - исходное изображение
 * @param patch - поля для обновления
 * @returns новая копия изображения
 */
const copyImageWith = (image: ImageEntity, patch: Partial<ImageEntity>): ImageEntity => (
  { ...image, ...patch } as ImageEntity
);

/**
 * Обновляет флаг try_on у изображения и переносит его в конец списка
 * @param images - текущий массив изображений товара
 * @param imageId - id изображения, у которого меняется флаг
 * @param tryOn - новое значение флага try_on
 * @returns обновлённый массив с единственным try_on и пересчитанным order
 */
export const setTryOnForImage = (images: ImageEntity[], imageId: number, tryOn: boolean): ImageEntity[] => {
  const updatedImages: ImageEntity[] = images.map((image) => {
    if (image.id === imageId) {
      return copyImageWith(image, { tryOn });
    }

    if (tryOn) {
      return copyImageWith(image, { tryOn: false });
    }

    return image;
  });

  if (!tryOn) {
    return updatedImages;
  }

  const tryOnImageIndex = updatedImages.findIndex(({ id }) => id === imageId);
  if (tryOnImageIndex < 0) {
    return updatedImages;
  }

  const tryOnImage = updatedImages[tryOnImageIndex];
  const reorderedImages = [
    ...updatedImages.slice(0, tryOnImageIndex),
    ...updatedImages.slice(tryOnImageIndex + 1),
    tryOnImage,
  ];

  return reorderedImages.map((image, index) => copyImageWith(image, { order: index }));
};
