import type { OmitBase } from '@/types/OmitBase';
import type { CartEntity } from '@server/db/entities/cart.entity';

export type CartItemInterface = OmitBase<CartEntity>;

export type CartItemFormInterface = Omit<CartItemInterface, 'id' | 'created' | 'updated' | 'user' | 'transform'>;
