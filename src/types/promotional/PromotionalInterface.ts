import type { OmitBase } from '@/types/OmitBase';
import type { PromotionalEntity } from '@server/db/entities/promotional.entity';

export type PromotionalInterface = OmitBase<PromotionalEntity>;

export type PromotionalFormInterface = Omit<PromotionalInterface, 'id' | 'created' | 'updated' | 'deleted' | 'orders'>;

export interface PromotionalResponseInterface {
  code: number;
  promotional: PromotionalInterface;
}
