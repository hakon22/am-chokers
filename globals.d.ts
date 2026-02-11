interface Window {
  YaDelivery: any;
  ecomStartWidget: any;
  CDEKWidget: any;
  dataLayer: {
    ecommerce: {
      currencyCode: 'RUB',
      purchase: {
        actionField: {
          id: string;
          coupon?: string;
          goal_id?: number;
          revenue?: number;
        };
        products: {
          id: string;
          name: string;
          brand?: string;
          category?: string;
          coupon?: string;
          discount?: number;
          list?: string;
          position?: number;
          price?: number;
          quantity?: number;
          variant?: string;
        }[];
      };
    };
  }[];
}
