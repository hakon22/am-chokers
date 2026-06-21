import { useCallback, useContext } from 'react';

import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { useUserLang } from '@/hooks/useUserLang';
import { SubmitContext } from '@/components/Context';
import { addCartItem, incrementCartItem, decrementCartItem, removeCartItem, type CartResponseInterface } from '@/slices/cartSlice';
import { pushEcommerceAddToCart } from '@/utilities/analytics/ecommerce';
import type { CartItemFormInterface } from '@/types/cart/Cart';

export const useCartItem = (itemId: number) => {
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);
  const { cart } = useAppSelector((state) => state.cart);
  const userLanguage = useUserLang();

  const inCart = cart.find((cartItem) => cartItem.item.id === itemId);

  const handleAdd = useCallback(async (count = 1) => {
    setIsSubmit(true);
    const { payload: { code, cartItem } } = await dispatch(addCartItem({ count, item: { id: itemId } } as CartItemFormInterface)) as { payload: CartResponseInterface; };
    if (code === 1) {
      pushEcommerceAddToCart({ cartItem, userLanguage: userLanguage as UserLangEnum, quantityAdded: count });
    }
    setIsSubmit(false);
  }, [dispatch, itemId, setIsSubmit, userLanguage]);

  const handleIncrement = useCallback(async () => {
    if (!inCart) {
      return;
    }
    setIsSubmit(true);
    const { payload: { code, cartItem } } = await dispatch(incrementCartItem(inCart.id)) as { payload: CartResponseInterface; };
    if (code === 1) {
      pushEcommerceAddToCart({ cartItem, userLanguage: userLanguage as UserLangEnum, quantityAdded: 1 });
    }
    setIsSubmit(false);
  }, [dispatch, inCart, setIsSubmit, userLanguage]);

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
