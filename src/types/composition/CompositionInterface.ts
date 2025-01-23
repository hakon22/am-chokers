import type { OmitBase } from '@/types/OmitBase';
import type { CompositionEntity } from '@server/db/entities/composition.entity';

export type CompositionInterface = OmitBase<CompositionEntity>;

export type CompositionFormInterface = Omit<CompositionInterface, 'id' | 'created' | 'updated' | 'deleted' | 'items'>;

export interface CompositionResponseInterface {
  code: number;
  composition: CompositionInterface;
}
