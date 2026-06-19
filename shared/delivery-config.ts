/**
 * Базовая стоимость доставки до пункта выдачи (руб.), если API не вернул точную сумму
 * Используется в JSON-LD, корзине, Yandex-виджете и YML-фидах
 */
export const DEFAULT_SHIPPING_RATE_RUB = 300;

/**
 * Форматирует базовую стоимость доставки для виджета Яндекс Доставки
 * @returns строка вида «300 руб»
 */
export const formatDefaultShippingRateRub = (): string => `${DEFAULT_SHIPPING_RATE_RUB} руб`;
