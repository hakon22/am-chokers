export enum RussianPostMailTypeEnum {
  /** Нестандартная посылка */
  POSTAL_PARCEL = 'POSTAL_PARCEL',
  /** Посылка первого класса */
  PARCEL_CLASS_1 = 'PARCEL_CLASS_1',
  /** Посылка онлайн */
  ONLINE_PARCEL = 'ONLINE_PARCEL',
  /** ЕКОМ маркетплейс */
  ECOM_MARKETPLACE = 'ECOM_MARKETPLACE',
}

export const russianPostMailTypeTranslateEnum: Record<RussianPostMailTypeEnum, string> = {
  [RussianPostMailTypeEnum.POSTAL_PARCEL]: 'Нестандартная посылка',
  [RussianPostMailTypeEnum.PARCEL_CLASS_1]: 'Посылка первого класса',
  [RussianPostMailTypeEnum.ONLINE_PARCEL]: 'Посылка онлайн',
  [RussianPostMailTypeEnum.ECOM_MARKETPLACE]: 'ЕКОМ маркетплейс',
};

export interface RussianPostDeliveryDataInterface {
  addressTo: string;
  areaTo?: string;
  boxSize: 's' | 'm' | 'l' | 'xl';
  cashOfDelivery: number;
  cityTo: string;
  deliveryDescription: {
    description: string;
    values: {
      deliveryMax: number;
      deliveryMin: number;
      extraTimeInHours: number;
    };
  };
  indexTo: string;
  mailType: RussianPostMailTypeEnum;
  pvzType: 'russian_post' | 'postamat';
  id: number;
  regionTo: string;
  sumoc: string;
  weight: string;
}
