import { useSyncExternalStore } from 'react';

let isHydrated = false;
const hydrationListeners = new Set<() => void>();

/**
 * Переключает флаг гидрации после paint и уведомляет подписчиков
 */
const markHydratedAfterPaint = (): void => {
  if (typeof window === 'undefined' || isHydrated) {
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      if (isHydrated) {
        return;
      }

      isHydrated = true;
      hydrationListeners.forEach((listener) => {
        listener();
      });
    });
  });
};

/**
 * Подписывает компонент на смену флага гидрации
 * @param onStoreChange - callback перерисовки из useSyncExternalStore
 * @returns функция отписки
 */
const subscribeToHydration = (onStoreChange: () => void): (() => void) => {
  hydrationListeners.add(onStoreChange);
  markHydratedAfterPaint();

  return () => {
    hydrationListeners.delete(onStoreChange);
  };
};

/**
 * Возвращает true после гидрации на клиенте; на SSR всегда false
 * @returns флаг завершения гидрации
 */
export const useHasHydrated = (): boolean => useSyncExternalStore(
  subscribeToHydration,
  () => isHydrated,
  () => false,
);
