import { YandexDeliveryStatusEnum } from '@server/types/delivery/yandex/enums/yandex.delivery.status.enum';
import { YandexDeliveryReasonStatusEnum } from '@server/types/delivery/yandex/enums/yandex.delivery.reason.status.enum';

export interface YandexRequestOrderResponseInterface {
  route_id: any;
  request_id: string;
  request: {
    info: {
      operator_request_id: string;
      referral_source: string;
    };
    source: {
      platform_station: {
        platform_id: string;
      };
    };
    destination: {
      type: string;
      platform_station: {
        platform_id: string;
      };
      interval: {
        from: number;
        to: number;
      };
      interval_utc: {
        from: string;
        to: string;
      };
    };
    items: {
      count: number;
      name: string;
      article: string;
      barcode: string;
      billing_details: {
        nds: number;
        unit_price: number;
        assessed_unit_price: number;
      };
      physical_dims: {
        dx: number;
        dy: number;
        dz: number;
      };
      place_barcode: string;
      refused_count: number;
    }[];
    places: {
      physical_dims: {
        dx: number;
        dy: number;
        dz: number;
        weight_gross: number;
      };
      barcode: string;
    }[];
    billing_info: {
      payment_method: string;
      delivery_cost: number;
    };
    recipient_info: {
      first_name: string;
      last_name: string;
      patronymic: string;
      phone: string;
    };
    available_actions: {
      update_dates_available: boolean;
      update_address_available: boolean;
      update_courier_to_pickup_available: boolean;
      update_pickup_to_courier_available: boolean;
      update_pickup_to_pickup_available: boolean;
      update_items: boolean;
      update_recipient: boolean;
      update_places: boolean;
    };
    particular_items_refuse: boolean;
    delivery_policy: {
      min: number;
      max: number;
      policy: string;
    };
  };
  state: {
      status: YandexDeliveryStatusEnum;
      description: string;
      timestamp_unix: number;
      timestamp: string;
      reason?: YandexDeliveryReasonStatusEnum;
  };
  full_items_price: number;
  sharing_url: string;
  courier_name: any;
  courier_phone: any;
  courier_phone_ext: any;
  courier_order_id: string;
}
