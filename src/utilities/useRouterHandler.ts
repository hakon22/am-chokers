import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const useRouterHandler = () => {
  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const handleStart = () => {
      // Устанавливаем таймаут на 1 секунду перед показом спиннера
      timeoutId = setTimeout(() => {
        setIsLoaded(false);
      }, 1000);
    };

    const handleComplete = () => {
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
