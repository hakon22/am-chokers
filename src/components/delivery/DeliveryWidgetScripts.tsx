import Script from 'next/script';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';

type DeliveryWidgetScriptKey = 'yandex' | 'russianPost' | 'cdek';

type DeliveryWidgetScriptsState = Record<DeliveryWidgetScriptKey, boolean>;

type DeliveryWidgetScriptsProps = {
  children: ReactNode;
};

const defaultDeliveryWidgetScriptsState: DeliveryWidgetScriptsState = {
  yandex: false,
  russianPost: false,
  cdek: false,
};

const DeliveryWidgetScriptsContext = createContext<DeliveryWidgetScriptsState>(defaultDeliveryWidgetScriptsState);

/**
 * Возвращает состояние загрузки скриптов виджетов доставки
 * @returns флаги готовности скриптов Яндекс, Почты России и СДЭК
 */
export const useDeliveryWidgetScripts = (): DeliveryWidgetScriptsState => useContext(DeliveryWidgetScriptsContext);

/**
 * Определяет ключ скрипта виджета по типу доставки
 * @param deliveryType - тип службы доставки
 * @returns ключ скрипта или undefined для типов без виджета
 */
export const getDeliveryWidgetScriptKey = (deliveryType: DeliveryTypeEnum): DeliveryWidgetScriptKey | undefined => {
  switch (deliveryType) {
  case DeliveryTypeEnum.YANDEX_DELIVERY:
    return 'yandex';
  case DeliveryTypeEnum.RUSSIAN_POST:
    return 'russianPost';
  case DeliveryTypeEnum.CDEK:
    return 'cdek';
  default:
    return undefined;
  }
};

/**
 * Проверяет готовность скрипта по ключу с учётом уже загруженных глобальных API
 * @param scriptKey - ключ скрипта виджета
 * @param scriptsState - состояние загрузки скриптов из контекста
 * @returns true, если скрипт готов к использованию
 */
const isDeliveryWidgetScriptKeyReady = (scriptKey: DeliveryWidgetScriptKey, scriptsState: DeliveryWidgetScriptsState): boolean => {
  if (scriptsState[scriptKey]) {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  switch (scriptKey) {
  case 'yandex':
    return Boolean(window.YaDelivery);
  case 'russianPost':
    return Boolean(window.ecomStartWidget);
  case 'cdek':
    return Boolean(window.CDEKWidget);
  default:
    return false;
  }
};

/**
 * Проверяет, загружен ли скрипт виджета для выбранного типа доставки
 * @param deliveryType - тип службы доставки
 * @param scriptsState - состояние загрузки скриптов
 * @returns true, если скрипт для типа доставки готов к использованию
 */
export const isDeliveryWidgetScriptReady = (deliveryType: DeliveryTypeEnum | undefined, scriptsState: DeliveryWidgetScriptsState): boolean => {
  if (!deliveryType) {
    return false;
  }

  const scriptKey = getDeliveryWidgetScriptKey(deliveryType);

  if (!scriptKey) {
    return false;
  }

  return isDeliveryWidgetScriptKeyReady(scriptKey, scriptsState);
};

/**
 * Подключает скрипты виджетов доставки и предоставляет их состояние через контекст
 * @param children - содержимое страницы корзины
 * @returns провайдер контекста и теги Script
 */
export const DeliveryWidgetScripts = ({ children }: DeliveryWidgetScriptsProps) => {
  const [scriptsState, setScriptsState] = useState<DeliveryWidgetScriptsState>(defaultDeliveryWidgetScriptsState);

  /**
   * Отмечает скрипт виджета как загруженный
   * @param scriptKey - ключ скрипта виджета
   */
  const markScriptLoaded = (scriptKey: DeliveryWidgetScriptKey): void => {
    setScriptsState((previousState) => {
      if (previousState[scriptKey]) {
        return previousState;
      }

      return {
        ...previousState,
        [scriptKey]: true,
      };
    });
  };

  const contextValue = useMemo(() => scriptsState, [scriptsState]);

  return (
    <DeliveryWidgetScriptsContext.Provider value={contextValue}>
      <Script
        id="yandex-widget"
        src="https://ndd-widget.landpro.site/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          markScriptLoaded('yandex');
        }}
      />
      <Script
        id="russian-post-widget"
        src="https://widget.pochta.ru/map/widget/widget.js"
        strategy="afterInteractive"
        onLoad={() => {
          markScriptLoaded('russianPost');
        }}
      />
      <Script
        id="cdek-widget"
        src="https://cdn.jsdelivr.net/npm/@cdek-it/widget@3"
        strategy="afterInteractive"
        onLoad={() => {
          markScriptLoaded('cdek');
        }}
      />
      {children}
    </DeliveryWidgetScriptsContext.Provider>
  );
};
