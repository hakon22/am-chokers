import { RussianPostMailTypeEnum } from '@server/types/delivery/russian.post.delivery.interface';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const getRussianPostRussianPostTranslate = (type: RussianPostMailTypeEnum, lang: UserLangEnum) => {

  const deliveryRussianPostTranslateRu: Record<RussianPostMailTypeEnum, string> = {
    [RussianPostMailTypeEnum.POSTAL_PARCEL]: 'Нестандартная посылка',
    [RussianPostMailTypeEnum.PARCEL_CLASS_1]: 'Посылка первого класса',
    [RussianPostMailTypeEnum.ONLINE_PARCEL]: 'Посылка онлайн',
    [RussianPostMailTypeEnum.ECOM_MARKETPLACE]: 'ЕКОМ маркетплейс',
  };

  const deliveryRussianPostTranslateEn: Record<RussianPostMailTypeEnum, string> = {
    [RussianPostMailTypeEnum.POSTAL_PARCEL]: 'Non-standard parcel',
    [RussianPostMailTypeEnum.PARCEL_CLASS_1]: 'First class package',
    [RussianPostMailTypeEnum.ONLINE_PARCEL]: 'Parcel online',
    [RussianPostMailTypeEnum.ECOM_MARKETPLACE]: 'ЕКОМ merketplace',
  };

  const translates: Record<UserLangEnum, Record<RussianPostMailTypeEnum, string>> = {
    [UserLangEnum.RU]: deliveryRussianPostTranslateRu,
    [UserLangEnum.EN]: deliveryRussianPostTranslateEn,
  };

  return translates[lang][type];
};
