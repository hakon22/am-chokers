import { useAppSelector } from '@/hooks/reduxHooks';
import { useHasHydrated } from '@/hooks/useHasHydrated';
import type { CartItemInterface } from '@/types/cart/Cart';

/**
 * Возвращает позицию корзины для товара после гидрации; до гидрации — undefined (совпадает с SSR)
 * @param itemId - идентификатор товара
 * @returns позиция в корзине или undefined
 */
export const useHydrationSafeInCart = (itemId: number): CartItemInterface | undefined => {
  const { cart } = useAppSelector((state) => state.cart);
  const hasHydrated = useHasHydrated();
  const cartItemInStore = cart.find((cartItem) => cartItem.item.id === itemId);

  return hasHydrated ? cartItemInStore : undefined;
};
