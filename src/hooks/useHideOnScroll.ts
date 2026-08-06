import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const DEFAULT_HIDE_SCROLL_DELTA_THRESHOLD = 8;
const DEFAULT_SHOW_SCROLL_DELTA_THRESHOLD = 24;
const DEFAULT_TOP_OFFSET_THRESHOLD = 48;

type UseHideOnScrollParams = {
  enabled: boolean;
  isLocked?: boolean;
  hideScrollDeltaThreshold?: number;
  showScrollDeltaThreshold?: number;
  topOffsetThreshold?: number;
};

/**
 * Управляет видимостью chrome при скролле: скрывает при прокрутке вниз, показывает при прокрутке вверх
 * @param params - параметры хука
 * @param params.enabled - включить отслеживание (например, только на мобилке)
 * @param params.isLocked - принудительно показывать chrome (меню, поиск и т.п.)
 * @param params.hideScrollDeltaThreshold - минимальный сдвиг вниз в px для скрытия chrome
 * @param params.showScrollDeltaThreshold - минимальный сдвиг вверх в px для показа (выше, чтобы игнорить дёрганье layout при подгрузке)
 * @param params.topOffsetThreshold - порог scrollY у верха страницы, ниже которого chrome всегда виден
 * @returns true, если chrome должен быть виден
 */
export const useHideOnScroll = ({
  enabled,
  isLocked = false,
  hideScrollDeltaThreshold = DEFAULT_HIDE_SCROLL_DELTA_THRESHOLD,
  showScrollDeltaThreshold = DEFAULT_SHOW_SCROLL_DELTA_THRESHOLD,
  topOffsetThreshold = DEFAULT_TOP_OFFSET_THRESHOLD,
}: UseHideOnScrollParams): boolean => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  const isVisibleRef = useRef(true);
  const frameRequestRef = useRef(0);

  useEffect(() => {
    if (!enabled || isLocked) {
      isVisibleRef.current = true;
      setIsVisible(true);
      return;
    }

    lastScrollYRef.current = window.scrollY;

    /**
     * Ставит видимость chrome в следующем кадре — Safari на iOS иначе глотает CSS transition в scroll-handler
     * @param nextIsVisible - показывать ли chrome
     */
    const scheduleVisibilityUpdate = (nextIsVisible: boolean): void => {
      if (nextIsVisible === isVisibleRef.current) {
        return;
      }

      isVisibleRef.current = nextIsVisible;

      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }

      frameRequestRef.current = requestAnimationFrame(() => {
        frameRequestRef.current = 0;
        setIsVisible(nextIsVisible);
      });
    };

    /**
     * Обновляет видимость chrome по направлению скролла
     */
    const handleScroll = (): void => {
      const currentScrollY = window.scrollY;
      const scrollDelta = currentScrollY - lastScrollYRef.current;

      if (currentScrollY < topOffsetThreshold) {
        lastScrollYRef.current = currentScrollY;
        scheduleVisibilityUpdate(true);
        return;
      }

      const isScrollingDown = scrollDelta > hideScrollDeltaThreshold;
      const isScrollingUp = scrollDelta < -showScrollDeltaThreshold;

      if (!isScrollingDown && !isScrollingUp) {
        return;
      }

      lastScrollYRef.current = currentScrollY;
      scheduleVisibilityUpdate(isScrollingUp);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);

      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
        frameRequestRef.current = 0;
      }
    };
  }, [enabled, isLocked, hideScrollDeltaThreshold, showScrollDeltaThreshold, topOffsetThreshold]);

  useEffect(() => {
    /**
     * Показывает chrome при полноценной смене маршрута (shallow игнор — page/query в каталоге)
     * @param _url - итоговый URL после навигации
     * @param options - опции завершения навигации Next.js
     * @param options.shallow - true при shallow-переходах без смены страницы
     */
    const handleRouteChange = (_url: string, { shallow }: { shallow?: boolean; } = {}): void => {
      if (shallow) {
        return;
      }

      setIsVisible(true);
      isVisibleRef.current = true;
      lastScrollYRef.current = window.scrollY;
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  if (!enabled || isLocked) {
    return true;
  }

  return isVisible;
};
