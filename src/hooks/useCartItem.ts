import { useCallback, useContext } from 'react';

import { useAppDispatch } from '@/hooks/reduxHooks';
import { useHydrationSafeInCart } from '@/hooks/useHydrationSafeInCart';
import { SubmitContext } from '@/components/Context';
import { addCartItem, incrementCartItem, decrementCartItem, removeCartItem } from '@/slices/cartSlice';
import type { CartItemFormInterface } from '@/types/cart/Cart';

/**
 * Управление добавлением товара в корзину и изменением количества
 * @param itemId - идентификатор товара
 * @returns состояние позиции в корзине и обработчики add/increment/decrement
 */
export const useCartItem = (itemId: number) => {
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);
  const inCart = useHydrationSafeInCart(itemId);

  const handleAdd = useCallback(async (count = 1) => {
    setIsSubmit(true);
    await dispatch(addCartItem({ count, item: { id: itemId } } as CartItemFormInterface));
    setIsSubmit(false);
  }, [dispatch, itemId, setIsSubmit]);

  const handleIncrement = useCallback(async () => {
    if (!inCart) {
      return;
    }
    setIsSubmit(true);
    await dispatch(incrementCartItem(inCart.id));
    setIsSubmit(false);
  }, [dispatch, inCart, setIsSubmit]);

  const handleDecrement = useCallback(async () => {
    if (!inCart) {
      return;
    }
    setIsSubmit(true);
    await dispatch(inCart.count > 1 ? decrementCartItem(inCart.id) : removeCartItem(inCart.id));
    setIsSubmit(false);
  }, [dispatch, inCart, setIsSubmit]);

  return { inCart, handleAdd, handleIncrement, handleDecrement };
};
