export enum DeliveryTypeEnum {
  /** Яндекс доставка */
  YANDEX_DELIVERY = 'YANDEX_DELIVERY',
  /** Почта России */
  RUSSIAN_POST = 'RUSSIAN_POST',
}

export const deliveryTypeTranslateEnum: Record<DeliveryTypeEnum, string> = {
  [DeliveryTypeEnum.YANDEX_DELIVERY]: 'Яндекс Доставка',
  [DeliveryTypeEnum.RUSSIAN_POST]: 'Почта России',
};
