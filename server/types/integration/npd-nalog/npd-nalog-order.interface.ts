import type { OrderEntity } from '@server/db/entities/order.entity';
import type { NpdNalogCreateIncomeInterface } from '@server/types/integration/npd-nalog/npd-nalog-create-income.interface';

export interface NpdNalogOrderInterface {
  order: OrderEntity;
  items: NpdNalogCreateIncomeInterface[];
}
