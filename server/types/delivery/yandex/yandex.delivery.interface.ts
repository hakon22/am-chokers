export interface YandexDeliveryDataInterface {
  id: string;
  address: {
    geoId: number;
    country: string;
    region: string;
    subRegion: string;
    locality: string;
    street: string;
    house: string;
    housing: string;
    apartment: string;
    building: string;
    comment: string;
    full_address: string;
    postal_code: string;
  };
}
