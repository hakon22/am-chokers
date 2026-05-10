import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import { routes } from '@/routes';

export const useRouterHandler = () => {
  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const pathWithoutQuery = (router.asPath.split('?')[0] ?? '').split('#')[0];
    if (pathWithoutQuery.startsWith(routes.page.telegram.root)) {
      const deferLoadedTimerId = window.setTimeout(() => {
        setIsLoaded(true);
      }, 0);
      return () => {
        window.clearTimeout(deferLoadedTimerId);
      };
    }

    let timeoutId: NodeJS.Timeout | null = null;

    const handleStart = (url: string, { shallow }: { shallow?: boolean; } = {}) => {
      if (shallow) {
        return;
      }
      // Устанавливаем таймаут на 1 секунду перед показом спиннера
      timeoutId = setTimeout(() => {
        setIsLoaded(false);
      }, 1000);
    };

    const handleComplete = (url: string, { shallow }: { shallow?: boolean; } = {}) => {
      if (shallow) {
        return;
      }
      // Отменяем таймаут, если переход завершился до истечения 1 секунды
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      setIsLoaded(true);
    };

    setTimeout(handleComplete, 1000);

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
  }, [router]);

  return isLoaded;
};
