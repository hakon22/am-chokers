const YANDEX_WIDGET_HIDDEN_POINT_DETAIL_LABELS = ['Частичный выкуп'] as const;
const YANDEX_WIDGET_HIDDEN_POINT_DETAIL_PREFIXES = ['Оплата'] as const;
const YANDEX_WIDGET_POINT_DETAIL_HIDE_OBSERVER_FLAG = 'yandexPointDetailInfoHiddenObserver';

/**
 * Проверяет, нужно ли скрыть строку карточки ПВЗ по её тексту
 * @param textContent - текст элемента .widget__point-detail-text
 * @returns true, если строку нужно скрыть
 */
const shouldHideYandexWidgetPointDetailText = (textContent: string): boolean => {
  const normalizedText = textContent.trim();

  if (YANDEX_WIDGET_HIDDEN_POINT_DETAIL_LABELS.some((label) => normalizedText === label)) {
    return true;
  }

  return YANDEX_WIDGET_HIDDEN_POINT_DETAIL_PREFIXES.some((prefix) => (
    normalizedText === prefix || normalizedText.startsWith(`${prefix}:`)
  ));
};

/**
 * Скрывает выбранные строки карточки ПВЗ (частичный выкуп, оплата)
 */
const hideYandexWidgetPointDetailRows = (): void => {
  document.querySelectorAll<HTMLElement>('.widget__point-detail-text').forEach((textElement) => {
    const { textContent } = textElement;
    if (!textContent || !shouldHideYandexWidgetPointDetailText(textContent)) {
      return;
    }

    const rowElement = textElement.closest<HTMLElement>('.widget__point-detail-row');
    if (rowElement) {
      rowElement.style.display = 'none';
    }
  });
};

/**
 * Подписывается на изменения DOM виджета и прячет блоки «Частичный выкуп» и «Оплата»
 * (в createWidget отдельных флагов скрытия нет)
 * @param containerId - id контейнера виджета
 */
export const scheduleYandexWidgetPointDetailInfoHide = (containerId = 'delivery-widget'): void => {
  const widgetRoot = document.getElementById(containerId);
  if (!widgetRoot) {
    return;
  }

  hideYandexWidgetPointDetailRows();

  if (widgetRoot.dataset[YANDEX_WIDGET_POINT_DETAIL_HIDE_OBSERVER_FLAG] === '1') {
    return;
  }

  const observer = new MutationObserver(() => {
    hideYandexWidgetPointDetailRows();
  });

  observer.observe(widgetRoot, { childList: true, subtree: true });
  widgetRoot.dataset[YANDEX_WIDGET_POINT_DETAIL_HIDE_OBSERVER_FLAG] = '1';
};
