export interface YandexCreateOrderInterface {
  info: {
    operator_request_id: string;
    comment?: string;
  };
  source: {
    platform_station: {
      platform_id: string;
    };
    interval?: {
      from: number;
      to: number;
    };
    interval_utc?: {
      from: string;
      to: string;
    };
  };
  destination: {
    type: 'platform_station' | 'custom_location';
    platform_station: {
      platform_id: string;
    };
    custom_location?: {
      latitude: number;
      longitude: number;
      details: {
        comment: string;
        full_address: string;
        room: string;
      };
    };
    interval?: {
      from: number;
      to: number;
    };
    interval_utc?: {
      from: string;
      to: string;
    };
  };
  items: {
    count: number;
    name: string;
    article: string;
    marking_code?: string;
    uin?: string;
    billing_details: {
      unit_price: number;
      assessed_unit_price: number;
      inn?: string;
      nds?: number;
    };
    physical_dims?: {
      predefined_volume: number;
      dx: number;
      dy: number;
      dz: number;
    };
    place_barcode: string;
  }[];
  places: {
    physical_dims: {
      weight_gross: number;
      dx: number;
      dy: number;
      dz: number;
    };
    barcode: string;
    description?: string;
  }[];
  billing_info: {
    payment_method: 'already_paid' | 'cash_on_receipt' | 'card_on_receipt';
    delivery_cost?: number;
  };
  recipient_info: {
    first_name: string;
    phone: string;
    email?: string;
    last_name?: string;
    partonymic?: string;
  };
  last_mile_policy: 'self_pickup' | 'time_interval';
  particular_items_refuse?: boolean;
}
