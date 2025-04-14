import type { OmitBase } from '@/types/OmitBase';
import type { ColorEntity } from '@server/db/entities/color.entity';

export type ColorInterface = OmitBase<ColorEntity>;

export type ColorFormInterface = Omit<ColorInterface, 'id' | 'created' | 'updated' | 'deleted' | 'items'>;

export interface ColorResponseInterface {
  code: number;
  color: ColorInterface;
}
