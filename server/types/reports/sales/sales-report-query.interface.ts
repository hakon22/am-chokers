import type { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import type { SalesReportPromoFilterEnum } from '@server/types/reports/sales/enums/sales-report-promo-filter.enum';

export interface SalesReportQueryInterface {
  /** Дата начала периода (не обязательна при ignorePeriod) */
  from?: string;
  /** Дата конца периода (не обязательна при ignorePeriod) */
  to?: string;
  /** Фильтр по типам доставки; пустой — все типы */
  deliveryTypes?: DeliveryTypeEnum[];
  /** Фильтр по наличию промокода */
  promoFilter?: SalesReportPromoFilterEnum;
  /** Не учитывать период — загрузить все заказы */
  ignorePeriod?: boolean;
}
