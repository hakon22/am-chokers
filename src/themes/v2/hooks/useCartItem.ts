import { useCallback, useContext } from 'react';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { addCartItem, incrementCartItem, decrementCartItem, removeCartItem } from '@/slices/cartSlice';
import type { CartItemFormInterface } from '@/types/cart/Cart';

export const useCartItem = (itemId: number) => {
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);
  const { cart } = useAppSelector((state) => state.cart);

  const inCart = cart.find((cartItem) => cartItem.item.id === itemId);

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
