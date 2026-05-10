import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { isEmpty } from 'lodash';

import { useAppDispatch } from '@/hooks/reduxHooks';
import { fetchTelegramWebAppAuth } from '@/slices/userSlice';
import { Spinner } from '@/components/Spinner';

type BootstrapPhase = 'loading_script' | 'authenticating' | 'ready' | 'not_in_telegram' | 'not_linked' | 'auth_failed';

/**
 * Загружает Telegram Web App SDK, при необходимости обменивает initData на JWT, затем рендерит детей
 * @param children - страница Mini App
 */
export const TelegramMiniAppBootstrap = ({ children }: { children: ReactNode; }): JSX.Element => {
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState<BootstrapPhase>('loading_script');

  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://telegram.org/js/telegram-web-app.js"]');

    if (existingScript) {
      window.setTimeout(() => {
        setPhase('authenticating');
      }, 0);
      return;
    }

    const scriptElement = document.createElement('script');
    scriptElement.src = 'https://telegram.org/js/telegram-web-app.js';
    scriptElement.async = true;
    scriptElement.onload = () => {
      setPhase('authenticating');
    };
    scriptElement.onerror = () => {
      setPhase('not_in_telegram');
    };
    document.body.appendChild(scriptElement);
  }, []);

  useEffect(() => {
    if (phase !== 'authenticating') {
      return;
    }

    const timerId = window.setTimeout(() => {
      const telegramWebApp = window.Telegram?.WebApp;

      if (telegramWebApp === undefined) {
        setPhase('not_in_telegram');
        return;
      }

      telegramWebApp.ready();
      telegramWebApp.expand();

      const initData = telegramWebApp.initData ?? '';

      if (isEmpty(initData)) {
        setPhase('not_in_telegram');
        return;
      }

      const runAuth = async () => {
        try {
          await dispatch(fetchTelegramWebAppAuth(initData)).unwrap();
          setPhase('ready');
        } catch (rejected: unknown) {
          const rejectionPayload = rejected as { code?: number; };
          if (rejectionPayload?.code === 3) {
            setPhase('not_linked');
          } else {
            setPhase('auth_failed');
          }
        }
      };

      void runAuth();
    }, 0);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [phase, dispatch]);

  if (phase === 'not_in_telegram') {
    return (
      <div className="p-4 text-center">
        Откройте эту страницу из Telegram (кнопка меню «Мои заказы» или ссылка из бота).
      </div>
    );
  }

  if (phase === 'not_linked') {
    return (
      <div className="p-4 text-center">
        Telegram ещё не привязан к аккаунту. Войдите на сайт в личный кабинет и нажмите «Привязать Telegram».
      </div>
    );
  }

  if (phase === 'auth_failed') {
    return (
      <div className="p-4 text-center">
        Не удалось войти через Telegram. Закройте мини-приложение и откройте снова.
      </div>
    );
  }

  if (phase !== 'ready') {
    return <Spinner isLoaded={false} />;
  }

  return <>{children}</>;
};
