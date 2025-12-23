import type { CDEKDeliveryStatusEnum } from '@server/types/delivery/cdek/enums/cdek-delivery-status.enum';
import type { CDEKResponseRequestInterface } from '@server/types/delivery/cdek/cdek-response.interface';
import type { CDEKItemsRequestInterface } from '@server/types/delivery/cdek/cdek-create-order-request.interface';

interface CDEKLocationInterface {
  code: number;
  city_uuid: string;
  city: string;
  country_code: string;
  country: string;
  region: string;
  region_code: number;
  longitude: number;
  latitude: number;
  address: string;
  postal_code: string;
}

export interface CDEKOrderResponseInterface {
  entity: {
    uuid: string;
    type: number;
    is_return: boolean;
    is_reverse: boolean;
    cdek_number: string;
    number: string;
    tariff_code: number;
    shipment_point: string;
    delivery_point: string;
    items_cost_currency: string;
    recipient_currency: string;
    delivery_recipient_cost: {
      value: number;
      vat_sum: number;
    };
    sender: {
      company: string;
      name: string;
      contragent_type: string;
      phones: { number: string; }[];
      passport_requirements_satisfied: boolean;
    };
    seller: {
      name: string;
    };
    recipient: {
      company: string;
      name: string;
      phones: { number: string; }[];
      passport_requirements_satisfied: boolean;
    };
    from_location: CDEKLocationInterface;
    to_location: CDEKLocationInterface;
    services: {
      code: string;
      parameter: string;
      sum: number;
      total_sum: number;
      discount_percent: number;
      discount_sum: number;
      vat_rate: number;
      vat_sum: number;
    }[];
    packages: {
      number: string;
      barcode: string;
      weight: number;
      length: number;
      width: number;
      weight_volume: number;
      weight_calc: number;
      height: number;
      comment: string;
      items: CDEKItemsRequestInterface[];
      package_id: string;
    }[];
    statuses: {
      code: CDEKDeliveryStatusEnum;
      name: string;
      date_time: string;
      city: string;
      deleted: boolean;
    }[];
    is_client_return: boolean;
    delivery_mode: string;
    has_reverse_order: boolean;
    delivery_detail: {
      delivery_sum: number;
      total_sum: number;
      payment_info: any[];
      delivery_vat_rate: number;
      delivery_vat_sum: number;
      delivery_discount_percent: number;
      delivery_discount_sum: number;
    };
    calls: any;
  };
  requests: Omit<CDEKResponseRequestInterface, 'errors' | 'warnings'>[];
  related_entities: any[];
}
