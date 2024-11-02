import type { InitialState } from '@/types/InitialState';
import type { OrderEntity } from '@server/db/entities/order.entity';
import type { OmitBase } from '@/types/OmitBase';

export type OrderInterface = OmitBase<OrderEntity> & InitialState;
