import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';

import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import { addCartItem, incrementCartItem, decrementCartItem, removeCartItem } from '@/slices/cartSlice';
import type { CartItemFormInterface } from '@/types/cart/Cart';

export const CartControl = ({ id, name, className = 'fs-6' }: { id: number; name: string; className?: string; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const dispatch = useAppDispatch();

  const { cart } = useAppSelector((state) => state.cart);

  const { setIsSubmit } = useContext(SubmitContext);

  const inCart = cart.find((cartItem) => cartItem.item.id === id);

  const add = async () => {
    setIsSubmit(true);
    const item: CartItemFormInterface = {
      count: 1,
      item: { id, name } as CartItemFormInterface['item'],
    };
    await dispatch(addCartItem(item));
    setIsSubmit(false);
  };

  const increment = async () => {
    if (!inCart) return;
    setIsSubmit(true);
    await dispatch(incrementCartItem(inCart.id));
    setIsSubmit(false);
  };

  const decrement = async () => {
    if (!inCart) return;
    setIsSubmit(true);
    await dispatch(inCart.count > 1 ? decrementCartItem(inCart.id) : removeCartItem(inCart.id));
    setIsSubmit(false);
  };

  return inCart ? (
    <div className="d-flex gap-3 justify-content-center align-items-center cart-control">
      <Button onClick={decrement}><MinusOutlined className="fs-6" title={t('remove')} /></Button>
      <span className={className}>{inCart.count}</span>
      <Button onClick={increment}><PlusOutlined className="fs-6" title={t('add')} /></Button>
    </div>
  ) : (
    <Button className="button border-button fs-5" title={t('addToCart')} onClick={add}>{t('addToCart')}</Button>
  );
};
