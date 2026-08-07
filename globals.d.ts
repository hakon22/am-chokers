interface YandexWidgetPointOfferInterface {
  pricing_total?: string | number;
  delivery_interval_min?: string;
  error?: string;
}

interface YandexDeliveryMapInterface {
  setBounds?: (bounds: unknown, options?: Record<string, unknown>) => unknown;
  setCenter?: (center: number[], zoom?: number, options?: Record<string, unknown>) => unknown;
  getZoom?: () => number;
}

interface Window {
  YaDelivery: {
    createWidget: (options: unknown) => void;
    setParams?: (params: unknown) => void;
    pointOfferMap?: Record<string, YandexWidgetPointOfferInterface>;
    map?: YandexDeliveryMapInterface;
  };
  ecomStartWidget: any;
  CDEKWidget: any;
}
