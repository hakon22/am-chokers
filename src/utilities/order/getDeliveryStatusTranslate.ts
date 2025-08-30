import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const getDeliveryStatusTranslate = (type: DeliveryTypeEnum, lang: UserLangEnum) => {
  const deliveryStatusTranslateRu: Record<DeliveryTypeEnum, string> = {
    [DeliveryTypeEnum.YANDEX_DELIVERY]: 'Яндекс Доставка',
    [DeliveryTypeEnum.RUSSIAN_POST]: 'Почта России',
  };

  const deliveryStatusTranslateEn: Record<DeliveryTypeEnum, string> = {
    [DeliveryTypeEnum.YANDEX_DELIVERY]: 'Yandex Delivery',
    [DeliveryTypeEnum.RUSSIAN_POST]: 'Russian Post',
  };

  const translates: Record<UserLangEnum, Record<DeliveryTypeEnum, string>> = {
    [UserLangEnum.RU]: deliveryStatusTranslateRu,
    [UserLangEnum.EN]: deliveryStatusTranslateEn,
  };

  return translates[lang][type];
};
