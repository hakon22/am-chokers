import type { CDEKWebhooksEnum } from '@server/types/delivery/cdek/enums/cdek-webhooks.enum';
import type { CDEKDeliveryStatusEnum } from '@server/types/delivery/cdek/enums/cdek-delivery-status.enum';

interface CDEKWebhooksRequestAttributesInterface {
  /** Признак возвратного заказа */
  is_return: boolean;
  /** Номер заказа СДЭК */
  cdek_number: string;
  /** Номер заказа в ИС Клиента */
  number?: string;
  /**
   * Код статуса (устаревшее поле)
   * @deprecated
   */
  status_code: string;
  /** Код дополнительного статуса */
  status_reason_code?: string;
  /** Дата и время установки статуса */
  status_date_time: string;
  /** Наименование города возникновения статуса */
  city_name: string;
  /** Код города возникновения статуса (не возвращается для статуса `Создан`) */
  city_code?: string;
  /** Код статуса */
  code: CDEKDeliveryStatusEnum;
  /** Признак реверсного заказа */
  is_reverse: boolean;
  /** Признак клиентского возврата */
  is_client_return: boolean;
  /** Связанные сущности, массив объектов */
  related_entities?: any[];
  /**
   * Тип связанной сущности, может принимать значения:
  * `direct_order` - прямой заказ
  * `client_direct_order` - прямой заказ, по которому оформлен клиентский возврат
  */
  type: 'direct_order' | 'client_direct_order';
  /** Идентификатор связанной сущности */
  uuid: string;
  /** Признак удаления статуса (применяется к ДД) */
  deleted?: string;
}

export interface CDEKWebhooksRequestInterface {
  /** Идентификатор сущности */
  uuid: string;
  /** Тип события */
  type: CDEKWebhooksEnum;
  /** Дата и время события в формате `ISO 8601` */
  date_time: string;
  /** Атрибуты события */
  attributes: CDEKWebhooksRequestAttributesInterface;
}
