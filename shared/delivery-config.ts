/**
 * Базовая стоимость доставки до пункта выдачи (руб.), если API не вернул точную сумму
 * Используется в JSON-LD, корзине, Yandex-виджете и YML-фидах
 */
export const DEFAULT_SHIPPING_RATE_RUB = 300;

/**
 * Порог суммы товаров (руб.), при котором доставка до ПВЗ бесплатна
 */
export const PRICE_FOR_FREE_DELIVERY_RUB = 10000;

/**
 * Доля высоты viewport для виджета доставки на десктопе
 */
export const DELIVERY_WIDGET_VIEWPORT_RATIO_DESKTOP = 0.8;

/**
 * Доля высоты viewport для виджета доставки на мобильных
 */
export const DELIVERY_WIDGET_VIEWPORT_RATIO_MOBILE = 0.85;

/**
 * Минимальная / максимальная высота виджета на десктопе, px
 */
export const DELIVERY_WIDGET_HEIGHT_MIN_DESKTOP_PX = 560;
export const DELIVERY_WIDGET_HEIGHT_MAX_DESKTOP_PX = 920;

/**
 * Минимальная / максимальная высота виджета на мобильных, px
 */
export const DELIVERY_WIDGET_HEIGHT_MIN_MOBILE_PX = 400;
export const DELIVERY_WIDGET_HEIGHT_MAX_MOBILE_PX = 960;

/**
 * Fallback высоты при SSR, px
 */
export const DELIVERY_WIDGET_HEIGHT_FALLBACK_DESKTOP_PX = 720;
export const DELIVERY_WIDGET_HEIGHT_FALLBACK_MOBILE_PX = 560;

/**
 * CSS-высота виджета доставки на десктопе (без чтения window — безопасно для SSR)
 */
export const DELIVERY_WIDGET_HEIGHT_CSS_DESKTOP = `clamp(${DELIVERY_WIDGET_HEIGHT_MIN_DESKTOP_PX}px, ${DELIVERY_WIDGET_VIEWPORT_RATIO_DESKTOP * 100}vh, ${DELIVERY_WIDGET_HEIGHT_MAX_DESKTOP_PX}px)`;

/**
 * CSS-высота виджета доставки на мобильных (без чтения window — безопасно для SSR)
 */
export const DELIVERY_WIDGET_HEIGHT_CSS_MOBILE = `clamp(${DELIVERY_WIDGET_HEIGHT_MIN_MOBILE_PX}px, ${DELIVERY_WIDGET_VIEWPORT_RATIO_MOBILE * 100}vh, ${DELIVERY_WIDGET_HEIGHT_MAX_MOBILE_PX}px)`;

/**
 * Возвращает CSS-значение высоты контейнера виджета (vh + clamp)
 * @param isMobile - мобильный viewport
 * @returns CSS-строка для style.height
 */
export const getDeliveryWidgetHeightCss = (isMobile: boolean): string => (
  isMobile ? DELIVERY_WIDGET_HEIGHT_CSS_MOBILE : DELIVERY_WIDGET_HEIGHT_CSS_DESKTOP
);

/**
 * Возвращает высоту виджета в пикселях по текущему viewport (только в браузере, напр. при openWidget)
 * @param isMobile - мобильный viewport
 * @returns высота в пикселях (доля viewport с clamp)
 */
export const getDeliveryWidgetHeightPx = (isMobile: boolean): number => {
  if (typeof window === 'undefined') {
    return isMobile
      ? DELIVERY_WIDGET_HEIGHT_FALLBACK_MOBILE_PX
      : DELIVERY_WIDGET_HEIGHT_FALLBACK_DESKTOP_PX;
  }

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportRatio = isMobile
    ? DELIVERY_WIDGET_VIEWPORT_RATIO_MOBILE
    : DELIVERY_WIDGET_VIEWPORT_RATIO_DESKTOP;
  const minimumHeightPx = isMobile
    ? DELIVERY_WIDGET_HEIGHT_MIN_MOBILE_PX
    : DELIVERY_WIDGET_HEIGHT_MIN_DESKTOP_PX;
  const maximumHeightPx = isMobile
    ? DELIVERY_WIDGET_HEIGHT_MAX_MOBILE_PX
    : DELIVERY_WIDGET_HEIGHT_MAX_DESKTOP_PX;
  const calculatedHeightPx = Math.round(viewportHeight * viewportRatio);

  return Math.min(maximumHeightPx, Math.max(minimumHeightPx, calculatedHeightPx));
};

/**
 * Дней до отгрузки в сторону Яндекс Доставки для расчёта сроков в виджете ПВЗ
 * (`0` — сегодня, `1` — завтра)
 */
export const YANDEX_DELIVERY_SHIPMENT_TERM_DAYS = 1;

/**
 * Фильтр карты виджета: только ПВЗ Яндекса (без партнёров и постаматов)
 * `operator_ids: market_l4g` — актуальный фильтр; `is_yandex_branded` — совместимость
 */
export const YANDEX_DELIVERY_WIDGET_POINT_FILTER = {
  type: ['pickup_point'],
  operator_ids: ['market_l4g'],
  is_yandex_branded: true,
  payment_methods: ['already_paid'],
  payment_methods_filter: 'and',
};

export type YandexDeliveryPackageSizeCode = 'S' | 'M' | 'L';

export type YandexDeliveryPackageSize = {
  code: YandexDeliveryPackageSizeCode;
  weightGrossGrams: number;
  dimensionXCm: number;
  dimensionYCm: number;
  dimensionZCm: number;
};

/**
 * Размеры посылки как в Яндекс Go (S / M / L)
 */
export const YANDEX_DELIVERY_PACKAGE_SIZES: Record<YandexDeliveryPackageSizeCode, YandexDeliveryPackageSize> = {
  S: {
    code: 'S',
    weightGrossGrams: 2000,
    dimensionXCm: 10,
    dimensionYCm: 25,
    dimensionZCm: 15,
  },
  M: {
    code: 'M',
    weightGrossGrams: 5000,
    dimensionXCm: 15,
    dimensionYCm: 35,
    dimensionZCm: 25,
  },
  L: {
    code: 'L',
    weightGrossGrams: 12000,
    dimensionXCm: 20,
    dimensionYCm: 40,
    dimensionZCm: 30,
  },
};

/**
 * Пороги количества товаров для выбора размера посылки (как сетка Go S/M/L)
 * 1 → S, 2–4 → M, 5+ → L
 */
export const YANDEX_DELIVERY_PACKAGE_SIZE_ITEM_THRESHOLDS = {
  sizeMFromItemCount: 2,
  sizeLFromItemCount: 5,
} as const;

/**
 * Считает суммарное количество единиц в позициях корзины
 * @param items - позиции корзины с полем count
 * @returns число единиц (минимум 1)
 */
export const getYandexWidgetPackageItemCount = (items: { count: number; }[]): number => {
  const totalCount = items.reduce((sum, { count }) => sum + count, 0);
  return Math.max(totalCount, 1);
};

/**
 * Выбирает размер посылки S/M/L по количеству товаров
 * @param itemCount - суммарное количество единиц
 * @returns параметры посылки
 */
export const resolveYandexDeliveryPackageSize = (itemCount: number): YandexDeliveryPackageSize => {
  const { sizeMFromItemCount, sizeLFromItemCount } = YANDEX_DELIVERY_PACKAGE_SIZE_ITEM_THRESHOLDS;

  if (itemCount >= sizeLFromItemCount) {
    return YANDEX_DELIVERY_PACKAGE_SIZES.L;
  }

  if (itemCount >= sizeMFromItemCount) {
    return YANDEX_DELIVERY_PACKAGE_SIZES.M;
  }

  return YANDEX_DELIVERY_PACKAGE_SIZES.S;
};

/**
 * Параметры веса и габаритов для createWidget: S/M/L по количеству товаров
 * @param items - позиции корзины с количеством
 * @returns physical_dims_* для params виджета
 */
export const getYandexWidgetPhysicalDimsParams = (items: { count: number; }[]): {
  physical_dims_weight_gross: number;
  physical_dims_dx: number;
  physical_dims_dy: number;
  physical_dims_dz: number;
} => {
  const packageSize = resolveYandexDeliveryPackageSize(getYandexWidgetPackageItemCount(items));

  return {
    physical_dims_weight_gross: packageSize.weightGrossGrams,
    physical_dims_dx: packageSize.dimensionXCm,
    physical_dims_dy: packageSize.dimensionYCm,
    physical_dims_dz: packageSize.dimensionZCm,
  };
};

/**
 * GUID склада отгрузки по умолчанию для расчёта цены/сроков в виджете ПВЗ
 */
export const DEFAULT_YANDEX_SOURCE_PLATFORM_STATION_ID = '866b253c-a0d8-4c85-b0b5-c692c9a5d9b6';

/**
 * Форматирует базовую стоимость доставки для виджета Яндекс Доставки
 * @returns строка вида «300 руб»
 */
export const formatDefaultShippingRateRub = (): string => `${DEFAULT_SHIPPING_RATE_RUB} руб`;

/**
 * Не даёт цене доставки в виджете опуститься ниже базовой ставки
 * @param price - цена от виджета в рублях
 * @returns цена не ниже DEFAULT_SHIPPING_RATE_RUB
 */
export const clampYandexWidgetDeliveryPrice = (price: number): number => (
  Math.max(price, DEFAULT_SHIPPING_RATE_RUB)
);

/**
 * Форматирует расчётную стоимость доставки от виджета Яндекс Доставки (минимум 300 руб)
 * @param price - стоимость доставки в рублях, полученная от виджета
 * @returns строка вида «300 руб»
 */
export const formatYandexWidgetDeliveryPrice = (price: number): string => (
  `${clampYandexWidgetDeliveryPrice(price)} руб`
);

/**
 * Выбирает GUID станции отгрузки для виджета Яндекс Доставки
 * @param credentialStationId - GUID из delivery_credentials.password, если задан
 * @returns GUID склада отгрузки (credentials → дефолт)
 */
export const resolveYandexSourcePlatformStationId = (credentialStationId?: string | null): string => {
  const fromCredentials = credentialStationId?.trim();
  if (fromCredentials) {
    return fromCredentials;
  }

  return DEFAULT_YANDEX_SOURCE_PLATFORM_STATION_ID;
};
