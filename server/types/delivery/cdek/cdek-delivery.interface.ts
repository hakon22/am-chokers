interface CDEKDeliveryOfficeInterface {
  city_code: number;
  city: string;
  type: string;
  postal_code: string;
  country_code: string;
  have_cashless: boolean;
  have_cash: boolean;
  allowed_cod: boolean;
  is_dressing_room: boolean;
  code: string;
  name: string;
  address: string;
  work_time: string;
  location: number[];
}

interface CDEKDeliveryDoorInterface {
  name: string;
  position: number[];
  kind: string;
  precision: string;
  formatted: string;
  postal_code: string;
  country_code: string;
  city: string;
}

interface CDEKDeliveryRateInterface {
  tariff_code: number;
  tariff_name: string;
  tariff_description: string;
  delivery_mode: number;
  period_min: number;
  period_max: number;
  delivery_sum: number;
  delivery_date_range?: {
    min: string;
    max: string;
  };
}

export type CDEKDeliveryDataType = ['office', CDEKDeliveryRateInterface, CDEKDeliveryOfficeInterface] | ['door', CDEKDeliveryRateInterface, CDEKDeliveryDoorInterface];
