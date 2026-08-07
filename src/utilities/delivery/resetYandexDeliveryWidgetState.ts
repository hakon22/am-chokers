const YANDEX_DELIVERY_WIDGET_DEFAULT_CONTAINER_ID = 'delivery-widget';

/**
 * Сбрасывает кэш офферов и DOM виджета перед повторным createWidget
 * (иначе pointOfferMap отдаёт старую цену при другом весе/габаритах)
 * @param containerId - id контейнера виджета
 */
export const resetYandexDeliveryWidgetState = (
  containerId = YANDEX_DELIVERY_WIDGET_DEFAULT_CONTAINER_ID,
): void => {
  if (window.YaDelivery?.pointOfferMap) {
    window.YaDelivery.pointOfferMap = {};
  }

  const widgetContainer = document.getElementById(containerId);
  if (widgetContainer) {
    widgetContainer.replaceChildren();
  }
};
