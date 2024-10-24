import type { ItemEntity } from '@server/db/entities/item.entity';
import type { OmitBase } from '@/types/omitBase';

export interface ItemInterface extends OmitBase<ItemEntity> {}
