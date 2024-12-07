import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, List } from 'antd';
import { DeleteOutlined, HeartOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import type { CheckboxProps } from 'antd/lib';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import type { CartItemInterface } from '@/types/cart/Cart';
import { ImageHover } from '@/components/ImageHover';
import { removeMany, removeCartItem, incrementCartItem, decrementCartItem } from '@/slices/cartSlice';
import { createOrder } from '@/slices/orderSlice';
import { toast } from '@/utilities/toast';

const Cart = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const dispatch = useAppDispatch();

  const { cart, loadingStatus } = useAppSelector((state) => state.cart);

  const { setIsSubmit } = useContext(SubmitContext);

  const [cartList, setCartList] = useState<CartItemInterface[]>([]);

  const isFull = cartList.length === cart.length;
  const indeterminate = cartList.length > 0 && cartList.length < cart.length;

  const delivery = 500;

  const { count, price } = cartList.reduce((acc, cartItem) => {
    acc.price += (cartItem.item.price - cartItem.item.discountPrice) * cartItem.count;
    acc.count += cartItem.count;
    return acc;
  }, { count: 0, price: 0 });

  const onChange = (cartItems: CartItemInterface[]) => {
    setCartList(cartItems);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = ({ target }) => {
    setCartList(target.checked ? cart : []);
  };

  const onFinish = async () => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(createOrder(cartList)) as { payload: { code: number } };
    if (code === 1) {
      const ids = cartList.map(({ id }) => id);
      dispatch(removeMany(ids));
      setCartList(cartList.filter(({ id }) => !ids.includes(id)));
      toast(tToast('orderCreateSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  const decrement = (item: CartItemInterface) => item.count > 1 ? decrementCartItem : removeCartItem;

  const cartItemHandler = async (item: CartItemInterface, action: 'increment' | 'decrement') => {
    setIsSubmit(true);
    const { payload } = await dispatch(action === 'increment' ? incrementCartItem(item.id) : decrement(item)(item.id)) as { payload: { code: number; cartItem: CartItemInterface; } };
    if (payload.code === 1) {
      setCartList((state) => {
        const filtered = state.filter((cartItem) => cartItem.id !== item.id);
        return action === 'decrement' && item.count === 1 ? filtered : [...filtered, payload.cartItem];
      });
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (loadingStatus === 'finish') {
      setCartList(cart);
    }
  }, [loadingStatus]);

  return (
    <div className="d-flex flex-column" style={{ marginTop: '12%' }}>
      <Helmet title={t('title', { count })} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title', { count })}</h1>
      <Form name="cart" className="d-flex col-12 gap-3 large-input font-oswald" onFinish={onFinish}>
        <div className="d-flex flex-column justify-content-center align-items-between col-8">
          <Checkbox className="mb-4" indeterminate={indeterminate} onChange={onCheckAllChange} checked={isFull}>
            {t('checkAll')}
          </Checkbox>
          <Checkbox.Group value={cartList} onChange={onChange}>
            <List
              dataSource={cart}
              className="w-100"
              renderItem={(item) => (
                <List.Item>
                  <div className="d-flex gap-3" style={{ width: 150, height: 150 }}>
                    <Checkbox value={item}>
                      <ImageHover
                        className="ms-3"
                        height={150}
                        width={150}
                        images={item.item?.images ?? []}
                      />
                    </Checkbox>
                    <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
                      <div className="d-flex flex-column">
                        <span>{item.item.name}</span>
                        <span>{tPrice('price', { price: item.item.price })}</span>
                      </div>
                      <div className="d-flex gap-4">
                        <div className="d-flex gap-3 justify-content-center align-items-center cart-control">
                          <Button onClick={() => cartItemHandler(item, 'decrement')}><MinusOutlined className="fs-6" /></Button>
                          <span className="fs-6">{item.count}</span>
                          <Button onClick={() => cartItemHandler(item, 'increment')}><PlusOutlined className="fs-6" /></Button>
                        </div>
                        <div className="d-flex gap-3">
                          <button className="icon-button" type="button" onClick={() => dispatch(removeCartItem(item.id))} title={t('delete')}>
                            <DeleteOutlined className="icon fs-5" />
                            <span className="visually-hidden">{t('delete')}</span>
                          </button>
                          <button className="icon-button" type="button" title={t('favorites')}>
                            <HeartOutlined className="icon fs-5" />
                            <span className="visually-hidden">{t('favorites')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Checkbox.Group>
        </div>
        <div className="col-4">
          <h3 className="mb-5 text-uppercase">{t('deliveryType')}</h3>
          <div className="d-flex justify-content-between fs-5 mb-2" style={{ fontWeight: 300 }}>
            <span>{t('itemCount', { count })}</span>
            <span>{tPrice('price', { price })}</span>
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4" style={{ fontWeight: 300 }}>
            <span>{t('delivery')}</span>
            <span>{tPrice('price', { price: delivery })}</span>
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4 text-uppercase fw-bold">
            <span>{t('total')}</span>
            <span>{tPrice('price', { price: price + delivery })}</span>
          </div>
          <Button className="button w-100" htmlType="submit">{t('submitPay')}</Button>
        </div>
      </Form>
    </div>
  );
};

export default Cart;
