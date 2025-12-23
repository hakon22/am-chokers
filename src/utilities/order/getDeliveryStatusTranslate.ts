import moment from 'moment';

import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { CDEKDeliveryTranslateStatus } from '@server/types/delivery/cdek/enums/cdek-delivery-translate.status';
import { yandexDeliveryTranslateStatus } from '@server/types/delivery/yandex/enums/yandex.delivery.translate.status';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import type { DeliveryEntity } from '@server/db/entities/delivery.entity';

export const getDeliveryStatusTranslate = (delivery: DeliveryEntity, lang: UserLangEnum) => {
  const translates: Record<DeliveryTypeEnum, typeof yandexDeliveryTranslateStatus | typeof CDEKDeliveryTranslateStatus | Record<UserLangEnum, null>> = {
    [DeliveryTypeEnum.YANDEX_DELIVERY]: yandexDeliveryTranslateStatus,
    [DeliveryTypeEnum.CDEK]: CDEKDeliveryTranslateStatus,
    [DeliveryTypeEnum.RUSSIAN_POST]: {
      [UserLangEnum.RU]: null,
      [UserLangEnum.EN]: null,
    },
  };

  if (!delivery.status) {
    return null;
  }

  return `${(translates[delivery.type][lang] as any)[delivery.status]} (${moment(delivery.updated).format(DateFormatEnum.DD_MM_YYYY_HH_MM)})`;
};
