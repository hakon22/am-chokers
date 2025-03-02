import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Tag } from 'antd';

import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import { addCartItem, incrementCartItem, decrementCartItem, removeCartItem, type CartResponseInterface } from '@/slices/cartSlice';
import type { CartItemFormInterface, CartItemInterface } from '@/types/cart/Cart';

export const CartControl = ({ id, deleted, className = 'fs-6', width, setCartList }: { id: number; deleted?: Date | null; width?: number; setCartList?: React.Dispatch<React.SetStateAction<CartItemInterface[]>>; className?: string; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });

  const dispatch = useAppDispatch();

  const { cart } = useAppSelector((state) => state.cart);

  const { setIsSubmit } = useContext(SubmitContext);

  const inCart = cart.find((cartItem) => cartItem.item.id === id);

  const add = async () => {
    setIsSubmit(true);
    const item: CartItemFormInterface = {
      count: 1,
      item: { id } as CartItemFormInterface['item'],
    };
    await dispatch(addCartItem(item));
    setIsSubmit(false);
  };

  const increment = async () => {
    if (!inCart) return;
    setIsSubmit(true);
    const { payload: { code, cartItem } } = await dispatch(incrementCartItem(inCart.id)) as { payload: CartResponseInterface };
    if (setCartList && code === 1) {
      setCartList((state) => {
        const cartIndex = state.findIndex((cartListItem) => cartListItem.id === cartItem.id);
        if (cartIndex !== -1) {
          state[cartIndex] = cartItem;
        }
        return state;
      });
    }
    setIsSubmit(false);
  };

  const decrement = async () => {
    if (!inCart) return;
    setIsSubmit(true);
    const { payload: { code, cartItem } } = await dispatch(inCart.count > 1 ? decrementCartItem(inCart.id) : removeCartItem(inCart.id)) as { payload: CartResponseInterface };
    if (setCartList && code === 1) {
      setCartList((state) => {
        if (inCart.count > 1) {
          const cartIndex = state.findIndex((cartListItem) => cartListItem.id === cartItem.id);
          if (cartIndex !== -1) {
            state[cartIndex] = cartItem;
          }
        } else {
          return state.filter((cartListItem) => cartListItem.id !== cartItem.id);
        }
        return state;
      });
    }
    setIsSubmit(false);
  };

  return deleted
    ? <Tag color="volcano" className="py-1 px-2">{tCart('deleted')}</Tag>
    : inCart ? (
      <div className="d-flex gap-3 justify-content-center align-items-center cart-control" style={width ? { width } : {}}>
        <Button onClick={decrement}><MinusOutlined className="fs-6" title={t('remove')} /></Button>
        <span className={className}>{inCart.count}</span>
        <Button onClick={increment}><PlusOutlined className="fs-6" title={t('add')} /></Button>
      </div>
    ) : (
      <Button className="button border-button fs-5" title={t('addToCart')} onClick={add}>{t('addToCart')}</Button>
    );
};
