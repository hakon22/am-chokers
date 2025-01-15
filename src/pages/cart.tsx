import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, List, Input, Tag } from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import type { CheckboxProps, InputProps } from 'antd/lib';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { SubmitContext } from '@/components/Context';
import { ImageHover } from '@/components/ImageHover';
import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { removeMany, removeCartItem } from '@/slices/cartSlice';
import { createOrder, type OrderResponseInterface } from '@/slices/orderSlice';
import { toast } from '@/utilities/toast';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { routes } from '@/routes';
import { NotFoundContent } from '@/components/NotFoundContent';
import { getPrice, getDiscount } from '@/utilities/order/getOrderPrice';
import type { PromotionalInterface, PromotionalResponseInterface } from '@/types/promotional/PromotionalInterface';
import type { CartItemInterface } from '@/types/cart/Cart';

const Cart = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { cart } = useAppSelector((state) => state.cart);

  const { setIsSubmit } = useContext(SubmitContext);

  const [cartList, setCartList] = useState<CartItemInterface[]>([]);
  const [selectPromotionField, setSelectPromotionField] = useState(false);
  const [promotional, setPromotional] = useState<PromotionalInterface>();

  const { count, price: preparedPrice } = cartList.reduce((acc, cartItem) => {
    acc.price += (cartItem.item.price - cartItem.item.discountPrice) * cartItem.count;
    acc.count += cartItem.count;
    return acc;
  }, { count: 0, price: 0 });

  const countCart = cart.reduce((acc, cartItem) => acc + cartItem.count, 0);

  const price = Math.floor(preparedPrice);
  const deliveryPrice = 500;

  const totalPrice = price + deliveryPrice;

  const isFull = cartList.length === cart.length;
  const indeterminate = cartList.length > 0 && cartList.length < cart.length;

  const width = 130;
  const height = 170;

  const [form] = Form.useForm();

  const onChange = (cartItems: CartItemInterface[]) => {
    setCartList(cartItems);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = async ({ target }) => {
    setCartList(target.checked ? cart : []);
  };

  const onPromotional: InputProps['onBlur'] = async ({ target }) => {
    try {
      setTimeout(setSelectPromotionField, 1000, false);
      if (!target.value) {
        return;
      }
      setIsSubmit(true);
      const { data } = await axios.get<PromotionalResponseInterface>(routes.getPromotionalByName, { params: { name: target.value } });
      if (data.code === 1) {
        setPromotional(data.promotional);
        toast(tToast('addPromotionalSuccess', { name: data.promotional.name }), 'success');
      } else if ([2, 3].includes(data.code)) {
        form.setFields([{ name: 'promotional', errors: [tValidation(data.code === 2 ? 'promotionalNotExist' : 'promotionalExpired')] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onPromotionalRemove = () => {
    setPromotional(undefined);
    form.resetFields();
  };

  const onFinish = async () => {
    setIsSubmit(true);
    const { payload: { code, order } } = await dispatch(createOrder({ cart: cartList, promotional, deliveryPrice })) as { payload: OrderResponseInterface };
    if (code === 1) {
      const ids = cartList.map(({ id }) => id);
      dispatch(removeMany(ids));
      setCartList(cartList.filter(({ id }) => !ids.includes(id)));
      form.resetFields();
      setPromotional(undefined);
      router.push(`${routes.orderHistory}/${order.id}`);
      toast(tToast('orderCreateSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    setCartList(cart);
  }, []);

  return (
    <div className="d-flex flex-column" style={{ marginTop: '12%' }}>
      <Helmet title={t('title', { count: countCart })} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title', { count: countCart })}</h1>
      <Form name="cart" className="d-flex col-12 gap-3 large-input font-oswald" onFinish={onFinish} form={form}>
        <div className="d-flex flex-column justify-content-center align-items-between col-8">
          <Checkbox className="mb-4" indeterminate={indeterminate} onChange={onCheckAllChange} checked={isFull}>
            {t('checkAll')}
          </Checkbox>
          <Checkbox.Group value={cartList} onChange={onChange}>
            <List
              dataSource={cart}
              className="w-100"
              locale={{
                emptyText: <NotFoundContent text={t('notFoundContent')} />,
              }}
              renderItem={(item) => (
                <List.Item>
                  <div className="d-flex gap-3" style={{ width, height }}>
                    <Checkbox value={item}>
                      <ImageHover
                        className="ms-3"
                        height={height}
                        width={width}
                        style={{ borderRadius: 7 }}
                        images={item.item?.images ?? []}
                      />
                    </Checkbox>
                    <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
                      <Link href={getHref(item.item)} className="d-flex flex-column gap-3">
                        <span className="lh-1">{item.item.name}</span>
                        <span>{tPrice('price', { price: item.item.price })}</span>
                      </Link>
                      <div className="d-flex gap-4">
                        <CartControl id={item.item.id} setCartList={setCartList} />
                        <div className="d-flex gap-3">
                          <button className="icon-button" type="button" onClick={() => dispatch(removeCartItem(item.id))} title={t('delete')}>
                            <DeleteOutlined className="icon fs-5" />
                            <span className="visually-hidden">{t('delete')}</span>
                          </button>
                          <Favorites id={item.item.id} className="fs-5" outlined={true} />
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
            <span>{tPrice('price', { price: deliveryPrice })}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center fs-5 mb-4" style={{ fontWeight: 300 }}>
            <span>{t('promotional')}</span>
            {promotional
              ? <div className="d-flex">
                <Tag color="green" className="d-flex align-items-center fs-6 py-1" closeIcon={<CloseOutlined className="fs-6-5" />} onClose={onPromotionalRemove}>{t('promotionalName', { name: promotional.name })}</Tag>
                <span>{t('promotionalDiscount', { discount: getDiscount(totalPrice, promotional) })}</span>
              </div>
              : <Form.Item name="promotional" className="large-input mb-0">
                <Input disabled={!cart.length} onSelect={() => setSelectPromotionField(true)} placeholder={t('promotional')} className="not-padding" size="large" onBlur={onPromotional} />
              </Form.Item>}
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4 text-uppercase fw-bold">
            <span>{t('total')}</span>
            <span>{tPrice('price', { price: getPrice(totalPrice, promotional) })}</span>
          </div>
          <Button disabled={selectPromotionField || !cart.length} className="button w-100" htmlType="submit">{t('submitPay')}</Button>
        </div>
      </Form>
    </div>
  );
};

export default Cart;
