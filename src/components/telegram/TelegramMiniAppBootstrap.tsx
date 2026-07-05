import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { isEmpty, isNil } from 'lodash';

import { useAppDispatch } from '@/hooks/reduxHooks';
import { fetchTelegramWebAppAuth } from '@/slices/userSlice';
import store from '@/slices/index';
import { routes } from '@/routes';
import { createTelegramMiniAppBootstrapLogger } from '@/utilities/log-telegram-mini-app-bootstrap';
import { TelegramMiniAppBootstrapLogPhaseEnum } from '@shared/enums/telegram-mini-app-bootstrap-log-phase.enum';
import {
  hasTelegramWebAppLaunchParametersInHash,
  persistTelegramWebAppInitData,
  resolveTelegramWebAppInitData,
  waitForTelegramWebAppInitData,
} from '@shared/parse-telegram-web-app-init-data-from-location';

type BootstrapPhase =
  | 'loading_script'
  | 'script_load_failed'
  | 'authenticating'
  | 'ready'
  | 'not_in_telegram'
  | 'not_linked'
  | 'auth_failed';

const TELEGRAM_WEB_APP_SDK_SELECTOR = 'script[data-telegram-web-app-sdk]';

const TELEGRAM_WEB_APP_ORG_SCRIPT_URL = 'https://telegram.org/js/telegram-web-app.js';

const SCRIPT_LOAD_TIMEOUT_MILLISECONDS = 15000;

const TERMINAL_BOOTSTRAP_PHASES: BootstrapPhase[] = [
  'ready',
  'script_load_failed',
  'not_in_telegram',
  'not_linked',
  'auth_failed',
];

let telegramMiniAppBootstrapCompleted = false;

/**
 * Возвращает уже вставленный SDK: наш прокси-скрипт или нативный скрипт WebView Telegram
 * @returns элемент script или null
 */
const findExistingTelegramWebAppScript = (): HTMLScriptElement | null =>
  document.querySelector<HTMLScriptElement>(TELEGRAM_WEB_APP_SDK_SELECTOR)
  ?? document.querySelector<HTMLScriptElement>(`script[src="${TELEGRAM_WEB_APP_ORG_SCRIPT_URL}"]`);

/**
 * Проверяет, можно ли пропустить bootstrap после remount (сессия уже авторизована)
 * @returns true, если фазу ready можно выставить сразу при mount
 */
const isTelegramMiniAppBootstrapSessionReady = (): boolean => {
  if (!telegramMiniAppBootstrapCompleted) {
    return false;
  }

  const { token, id: userId } = store.getState().user;

  return !isEmpty(token) || !isNil(userId);
};

/**
 * Возвращает начальную фазу bootstrap с учётом завершённой сессии
 * @returns loading_script или ready
 */
const resolveInitialBootstrapPhase = (): BootstrapPhase => (
  isTelegramMiniAppBootstrapSessionReady() ? 'ready' : 'loading_script'
);

/**
 * Загружает Telegram Web App SDK, при необходимости обменивает initData на JWT, затем рендерит детей
 * @param children - страница Mini App
 */
export const TelegramMiniAppBootstrap = ({ children }: { children: ReactNode; }): JSX.Element | null => {
  const dispatch = useAppDispatch();
  const [phase, setPhase] = useState<BootstrapPhase>(resolveInitialBootstrapPhase);
  const [loadAttempt, setLoadAttempt] = useState(0);

  const logBootstrapEventRef = useRef(createTelegramMiniAppBootstrapLogger(0));

  useEffect(() => {
    logBootstrapEventRef.current = createTelegramMiniAppBootstrapLogger(loadAttempt);
  }, [loadAttempt]);

  useEffect(() => {
    if (!TERMINAL_BOOTSTRAP_PHASES.includes(phase)) {
      return;
    }

    logBootstrapEventRef.current({
      phase: TelegramMiniAppBootstrapLogPhaseEnum.PHASE_FINAL,
      bootstrapPhase: phase,
    });
  }, [phase]);

  /**
   * Переводит bootstrap в фазу ready и запоминает завершение сессии
   */
  const markBootstrapReady = useCallback((): void => {
    telegramMiniAppBootstrapCompleted = true;
    setPhase('ready');
  }, []);

  /**
   * Перезапускает загрузку SDK после ошибки (только наш прокси-скрипт)
   */
  const handleRetryScriptLoad = useCallback((): void => {
    document.querySelector(TELEGRAM_WEB_APP_SDK_SELECTOR)?.remove();
    setPhase('loading_script');
    setLoadAttempt((previousAttempt) => previousAttempt + 1);
  }, []);

  useEffect(() => {
    if (phase !== 'loading_script') {
      return undefined;
    }

    logBootstrapEventRef.current({
      phase: TelegramMiniAppBootstrapLogPhaseEnum.BOOTSTRAP_START,
      bootstrapPhase: 'loading_script',
    });

    const existingScript = findExistingTelegramWebAppScript();

    if (existingScript) {
      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.SCRIPT_REUSED,
        bootstrapPhase: 'loading_script',
      });
      const reuseScriptTimerId = window.setTimeout(() => {
        setPhase('authenticating');
      }, 0);

      return () => {
        window.clearTimeout(reuseScriptTimerId);
      };
    }

    let isCancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (!isCancelled) {
        logBootstrapEventRef.current({
          phase: TelegramMiniAppBootstrapLogPhaseEnum.SCRIPT_TIMEOUT,
          bootstrapPhase: 'loading_script',
        });
        setPhase('script_load_failed');
      }
    }, SCRIPT_LOAD_TIMEOUT_MILLISECONDS);

    const scriptUrl = routes.integration.telegram.webAppScript;
    logBootstrapEventRef.current({
      phase: TelegramMiniAppBootstrapLogPhaseEnum.SCRIPT_REQUEST,
      bootstrapPhase: 'loading_script',
      scriptUrl,
    });

    const scriptElement = document.createElement('script');
    scriptElement.src = scriptUrl;
    scriptElement.async = true;
    scriptElement.dataset.telegramWebAppSdk = 'true';
    scriptElement.onload = () => {
      if (isCancelled) {
        return;
      }
      window.clearTimeout(timeoutId);
      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.SCRIPT_ONLOAD,
        bootstrapPhase: 'loading_script',
        scriptUrl,
      });
      setPhase('authenticating');
    };
    scriptElement.onerror = () => {
      if (isCancelled) {
        return;
      }
      window.clearTimeout(timeoutId);
      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.SCRIPT_ONERROR,
        bootstrapPhase: 'loading_script',
        scriptUrl,
      });
      setPhase('script_load_failed');
    };
    document.body.appendChild(scriptElement);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadAttempt]);

  useEffect(() => {
    if (phase !== 'authenticating') {
      return undefined;
    }

    let isCancelled = false;

    const runAuthentication = async () => {
      const telegramWebApp = window.Telegram?.WebApp;
      const hasHashLaunchParams = hasTelegramWebAppLaunchParametersInHash(window.location.hash);

      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.AUTHENTICATING,
        bootstrapPhase: 'authenticating',
        hasTelegramWebApp: telegramWebApp !== undefined,
        hasHashLaunchParams,
      });

      if (telegramWebApp !== undefined) {
        telegramWebApp.ready();
        telegramWebApp.expand();
      }

      const readInitData = (): string => resolveTelegramWebAppInitData(
        telegramWebApp?.initData,
        window.location.hash,
      );

      const initData = await waitForTelegramWebAppInitData(readInitData);

      if (isCancelled) {
        return;
      }

      if (isEmpty(initData)) {
        logBootstrapEventRef.current({
          phase: TelegramMiniAppBootstrapLogPhaseEnum.INIT_DATA_EMPTY,
          bootstrapPhase: 'authenticating',
          hasTelegramWebApp: telegramWebApp !== undefined,
          hasHashLaunchParams,
          initDataLength: 0,
        });

        const hasTelegramLaunchContext = telegramWebApp !== undefined || hasHashLaunchParams;

        setPhase(hasTelegramLaunchContext ? 'auth_failed' : 'not_in_telegram');
        return;
      }

      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.INIT_DATA_RESOLVED,
        bootstrapPhase: 'authenticating',
        hasTelegramWebApp: telegramWebApp !== undefined,
        hasHashLaunchParams,
        initDataLength: initData.length,
      });

      persistTelegramWebAppInitData(initData);

      logBootstrapEventRef.current({
        phase: TelegramMiniAppBootstrapLogPhaseEnum.AUTH_REQUEST,
        bootstrapPhase: 'authenticating',
        initDataLength: initData.length,
      });

      try {
        await dispatch(fetchTelegramWebAppAuth(initData)).unwrap();

        if (!isCancelled) {
          logBootstrapEventRef.current({
            phase: TelegramMiniAppBootstrapLogPhaseEnum.AUTH_SUCCESS,
            bootstrapPhase: 'authenticating',
          });
          markBootstrapReady();
        }
      } catch (rejected: unknown) {
        if (isCancelled) {
          return;
        }

        const rejectionPayload = rejected as { code?: number; };

        logBootstrapEventRef.current({
          phase: TelegramMiniAppBootstrapLogPhaseEnum.AUTH_REJECTED,
          bootstrapPhase: 'authenticating',
          authCode: rejectionPayload?.code,
        });

        if (rejectionPayload?.code === 3) {
          setPhase('not_linked');
        } else {
          setPhase('auth_failed');
        }
      }
    };

    void runAuthentication();

    return () => {
      isCancelled = true;
    };
  }, [phase, dispatch, markBootstrapReady]);

  if (phase === 'script_load_failed') {
    return (
      <div className="p-4 text-center">
        <p>
          Не удалось загрузить компонент Telegram. Проверьте интернет и нажмите «Повторить»
          или закройте и откройте мини-приложение снова.
        </p>
        <button
          type="button"
          className="btn btn-primary mt-3"
          onClick={handleRetryScriptLoad}
        >
          Повторить
        </button>
      </div>
    );
  }

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
    return null;
  }

  return <>{children}</>;
};
