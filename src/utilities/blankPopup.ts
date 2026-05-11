/**
 * Синхронно открывает пустую вкладку в браузере.
 * Используется для обхода блокировки popup на мобильных браузерах (в первую очередь iOS Safari),
 * когда фактическая навигация на целевой URL должна произойти после асинхронного запроса.
 * Должен вызываться СИНХРОННО внутри обработчика пользовательского жеста (например, click),
 * иначе браузер посчитает popup программным и заблокирует его.
 * @returns ссылка на открытое окно или null, если открыть не удалось (например, на сервере или при блокировке)
 */
export const openBlankPopup = (): Window | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.open('about:blank', '_blank');
};

/**
 * Перенаправляет ранее открытое через openBlankPopup окно на целевой URL.
 * Если окно недоступно (заблокировано или закрыто), выполняется навигация текущей вкладки как fallback.
 * @param popup - окно, возвращённое из openBlankPopup
 * @param targetUrl - целевой URL для перехода
 */
export const navigateBlankPopup = (popup: Window | null, targetUrl: string): void => {
  if (popup && !popup.closed) {
    try {
      popup.opener = null;
    } catch {
      // некоторые браузеры запрещают модификацию opener для cross-origin URL — игнорируем
    }
    popup.location.replace(targetUrl);
    return;
  }
  if (typeof window !== 'undefined') {
    window.location.href = targetUrl;
  }
};

/**
 * Закрывает ранее открытое через openBlankPopup окно, если оно ещё открыто.
 * @param popup - окно, возвращённое из openBlankPopup
 */
export const closeBlankPopup = (popup: Window | null): void => {
  if (popup && !popup.closed) {
    popup.close();
  }
};
