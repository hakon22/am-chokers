/** Минимально допустимая цена товара (руб.) после массовой корректировки */
export const MIN_ITEM_PRICE_AFTER_ADJUST = 1;

/**
  * Рассчитывает новую цену товара
  * @param price - текущая цена товара
  * @param percentage - процент увеличения (например, 10 для 10%)
  * @param multiple - кратность для округления (например, 100)
  * @returns новая цена, округлённая до кратного значения в большую сторону
  */
export const adjustPriceByPercentAndMultiple = (price: number, percentage: number, multiple: number): number => {
  const priceWithPercentage = price * (1 + percentage / 100);
  return Math.ceil(priceWithPercentage / multiple) * multiple;
};
