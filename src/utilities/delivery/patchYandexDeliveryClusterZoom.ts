import { isNil } from 'lodash';

const YANDEX_DELIVERY_ORIGINAL_SET_BOUNDS_KEY = '__amChokersOriginalSetBounds';

/** На сколько уровней приближать карту при клике по кластеру ПВЗ */
const YANDEX_DELIVERY_CLUSTER_ZOOM_STEP = 2;

/** Максимальный zoom после клика по кластеру */
const YANDEX_DELIVERY_CLUSTER_MAX_ZOOM = 21;

/** Длительность анимации клика по кластеру в виджете Яндекса (Ol) */
const YANDEX_DELIVERY_CLUSTER_ANIMATION_DURATION_MS = 600;

/** timingFunction клика по кластеру в виджете Яндекса (El) */
const YANDEX_DELIVERY_CLUSTER_ANIMATION_EASING = 'ease-in-out';

type YandexMapSetBoundsOptions = {
  checkZoomRange?: boolean;
  zoomMargin?: number | number[];
  duration?: number;
  timingFunction?: string;
  [key: string]: unknown;
};

type YandexMapSetBounds = (bounds: unknown, options?: YandexMapSetBoundsOptions) => unknown;

type YandexMapLike = {
  setBounds: YandexMapSetBounds;
  setCenter?: (center: number[], zoom?: number, options?: YandexMapSetBoundsOptions) => unknown;
  getZoom?: () => number;
  [YANDEX_DELIVERY_ORIGINAL_SET_BOUNDS_KEY]?: YandexMapSetBounds;
};

/**
 * Проверяет, что значение похоже на bounds Яндекс.Карт [[lat, lon], [lat, lon]]
 * @param bounds - аргумент setBounds
 * @returns true, если можно взять центр
 */
const isYandexMapBounds = (bounds: unknown): bounds is number[][] => (
  Array.isArray(bounds)
  && bounds.length === 2
  && Array.isArray(bounds[0])
  && Array.isArray(bounds[1])
  && bounds[0].length >= 2
  && bounds[1].length >= 2
  && Number.isFinite(bounds[0][0])
  && Number.isFinite(bounds[0][1])
  && Number.isFinite(bounds[1][0])
  && Number.isFinite(bounds[1][1])
);

/**
 * Считает географический центр bounds
 * @param bounds - [[lat, lon], [lat, lon]]
 * @returns центр [lat, lon]
 */
const getYandexMapBoundsCenter = (bounds: number[][]): number[] => (
  [
    (bounds[0][0] + bounds[1][0]) / 2,
    (bounds[0][1] + bounds[1][1]) / 2,
  ]
);

/**
 * Отличает setBounds от клика по кластеру виджета от внутренних вызовов (pinch и т.п.)
 * @param options - опции setBounds
 * @returns true, если это зум по тапу на группу ПВЗ
 */
const isYandexDeliveryClusterSetBoundsCall = (options: YandexMapSetBoundsOptions): boolean => (
  options.duration === YANDEX_DELIVERY_CLUSTER_ANIMATION_DURATION_MS
  && options.timingFunction === YANDEX_DELIVERY_CLUSTER_ANIMATION_EASING
  && !isNil(options.zoomMargin)
);

/**
 * Патчит setBounds для клика по кластеру ПВЗ (setCenter +2);
 * @returns true, если карта готова и патч навешан
 */
const patchYandexDeliveryClusterZoom = (): boolean => {
  const map = window.YaDelivery?.map as YandexMapLike | undefined;

  if (!map?.setBounds || !map.setCenter || !map.getZoom) {
    return false;
  }

  const originalSetBounds = map[YANDEX_DELIVERY_ORIGINAL_SET_BOUNDS_KEY] ?? map.setBounds.bind(map);
  map[YANDEX_DELIVERY_ORIGINAL_SET_BOUNDS_KEY] = originalSetBounds;

  map.setBounds = (bounds: unknown, options: YandexMapSetBoundsOptions = {}) => {
    if (!isYandexDeliveryClusterSetBoundsCall(options) || !isYandexMapBounds(bounds)) {
      return originalSetBounds(bounds, options);
    }

    const center = getYandexMapBoundsCenter(bounds);
    const currentZoom = map.getZoom?.() ?? 10;
    const targetZoom = Math.min(
      currentZoom + YANDEX_DELIVERY_CLUSTER_ZOOM_STEP,
      YANDEX_DELIVERY_CLUSTER_MAX_ZOOM,
    );

    return map.setCenter?.(center, targetZoom, {
      duration: options.duration,
      timingFunction: options.timingFunction,
      checkZoomRange: false,
    });
  };

  return true;
};

/**
 * Ждёт появления YaDelivery.map и патчит зум по клику на кластер ПВЗ
 * @param maxAttempts - максимум попыток
 * @param intervalMs - пауза между попытками, мс
 */
export const scheduleYandexDeliveryClusterZoomPatch = (maxAttempts = 40, intervalMs = 100): void => {
  let attempts = 0;

  const tryPatch = () => {
    if (patchYandexDeliveryClusterZoom()) {
      return;
    }

    attempts += 1;
    if (attempts >= maxAttempts) {
      return;
    }

    window.setTimeout(tryPatch, intervalMs);
  };

  window.requestAnimationFrame(tryPatch);
};
