import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const getDeliveryTypeTranslate = (type: DeliveryTypeEnum, lang: UserLangEnum) => {
  const deliveryTypeTranslateRu: Record<DeliveryTypeEnum, string> = {
    [DeliveryTypeEnum.YANDEX_DELIVERY]: 'Яндекс Доставка',
    [DeliveryTypeEnum.RUSSIAN_POST]: 'Почта России',
    [DeliveryTypeEnum.CDEK]: 'СДЭК',
  };

  const deliveryTypeTranslateEn: Record<DeliveryTypeEnum, string> = {
    [DeliveryTypeEnum.YANDEX_DELIVERY]: 'Yandex Delivery',
    [DeliveryTypeEnum.RUSSIAN_POST]: 'Russian Post',
    [DeliveryTypeEnum.CDEK]: 'CDEK',
  };

  const translates: Record<UserLangEnum, Record<DeliveryTypeEnum, string>> = {
    [UserLangEnum.RU]: deliveryTypeTranslateRu,
    [UserLangEnum.EN]: deliveryTypeTranslateEn,
  };

  return translates[lang][type];
};
