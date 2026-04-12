/** Сортировка изображений товара по полю `order` */
export const sortItemImagesByOrder = <T extends { order?: number | null }>(
  images: T[] | undefined | null,
): T[] => {
  if (!images?.length) {
    return [];
  }
  return [...images].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};
