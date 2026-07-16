import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { routes } from '@/routes';

const ROUTE_SPINNER_DELAY_MS = 1000;
const FONTS_READY_TIMEOUT_MS = 2000;

/**
 * Извлекает путь без query и hash
 * @param asPath - полный путь из Next.js router
 * @returns путь без query и hash
 */
const getPathWithoutQuery = (asPath: string): string => (asPath.split('?')[0] ?? '').split('#')[0];

/**
 * Ожидает promise не дольше заданного таймаута
 * @param promise - promise для ожидания (например, document.fonts.ready)
 * @param timeoutMs - максимальное время ожидания в миллисекундах
 * @returns promise, который завершится по готовности promise или по таймауту
 */
const waitWithTimeout = (promise: Promise<unknown>, timeoutMs: number): Promise<void> =>
  Promise.race([
    promise.then(() => undefined),
    new Promise<void>((resolve) => {
      window.setTimeout(resolve, timeoutMs);
    }),
  ]);

/**
 * Управляет глобальным спиннером: скрывает оверлей после готовности роутера и при завершении навигации
 * @returns true, когда контент можно показывать без полноэкранного спиннера
 */
export const useRouterHandler = () => {
  const router = useRouter();
  const pathWithoutQuery = getPathWithoutQuery(router.asPath);
  const isTelegramRoute = pathWithoutQuery.startsWith(routes.page.telegram.root);

  const [isLoaded, setIsLoaded] = useState(isTelegramRoute);
  const [hasCompletedInitialLoad, setHasCompletedInitialLoad] = useState(isTelegramRoute);

  useEffect(() => {
    if (!isTelegramRoute) {
      return undefined;
    }

    const telegramLoadedTimerId = window.setTimeout(() => {
      setIsLoaded(true);
    }, 0);

    return () => {
      window.clearTimeout(telegramLoadedTimerId);
    };
  }, [isTelegramRoute]);

  useEffect(() => {
    if (isTelegramRoute || hasCompletedInitialLoad || !router.isReady) {
      return undefined;
    }

    let isCancelled = false;

    const completeInitialLoad = () => {
      if (isCancelled) {
        return;
      }

      setHasCompletedInitialLoad(true);
      setIsLoaded(true);
    };

    const waitForInitialPaint = async () => {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await waitWithTimeout(document.fonts.ready, FONTS_READY_TIMEOUT_MS);
        } catch {
          // fonts API недоступен — продолжаем без ожидания
        }
      }

      if (isCancelled) {
        return;
      }

      window.requestAnimationFrame(completeInitialLoad);
    };

    waitForInitialPaint();

    return () => {
      isCancelled = true;
    };
  }, [hasCompletedInitialLoad, isTelegramRoute, router.isReady]);

  useEffect(() => {
    if (isTelegramRoute) {
      return undefined;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let spinnerTimeoutGeneration = 0;

    const handleStart = (_url: string, { shallow }: { shallow?: boolean; } = {}) => {
      if (shallow) {
        return;
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      spinnerTimeoutGeneration += 1;
      const currentGeneration = spinnerTimeoutGeneration;

      timeoutId = setTimeout(() => {
        if (currentGeneration !== spinnerTimeoutGeneration) {
          return;
        }

        setIsLoaded(false);
        timeoutId = null;
      }, ROUTE_SPINNER_DELAY_MS);
    };

    const handleComplete = (_url: string, { shallow }: { shallow?: boolean; } = {}) => {
      if (shallow) {
        return;
      }

      spinnerTimeoutGeneration += 1;

      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      setIsLoaded(true);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [isTelegramRoute, router]);

  return isLoaded;
};
