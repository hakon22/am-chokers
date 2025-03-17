import type { EntityManager } from 'typeorm';

import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';

export interface DeliveryOptionsInterface {
  /** `id` службы доставки */
  id?: number;
  /** Тип службы доставки */
  type?: DeliveryTypeEnum;
  /** Тестовая учётная запись или нет */
  isDevelopment?: boolean;
  /** С данными для доступа */
  withCredentials?: boolean;
  /** С удалёнными */
  withDeleted?: boolean;
  /** Менеджер typeorm */
  manager?: EntityManager;
}
