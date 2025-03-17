import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, List, Input, Tag, Modal, Radio } from 'antd';
import { CloseOutlined, DeleteOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import cn from 'classnames';
import type { CheckboxProps, InputProps } from 'antd/lib';
import type { CheckboxGroupProps } from 'antd/lib/checkbox';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { ImageHover } from '@/components/ImageHover';
import { Favorites } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { removeMany, removeCartItem } from '@/slices/cartSlice';
import { createOrder, type OrderResponseInterface } from '@/slices/orderSlice';
import { toast } from '@/utilities/toast';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { routes } from '@/routes';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import { getPrice, getDiscount } from '@/utilities/order/getOrderPrice';
import type { PromotionalInterface, PromotionalResponseInterface } from '@/types/promotional/PromotionalInterface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import type { CreateOrderInterface } from '@/types/order/Order';

interface YandexDeliveryDataInterface {
  id: string;
  address: {
    geoId: number;
    country: string;
    region: string;
    subRegion: string;
    locality: string;
    street: string;
    house: string;
    housing: string;
    apartment: string;
    building: string;
    comment: string;
    full_address: string;
    postal_code: string;
  };
}

const ControlButtons = ({ item, isMobile, width, setCartList }: { item: CartItemInterface; isMobile?: boolean; width?: number; setCartList: React.Dispatch<React.SetStateAction<CartItemInterface[]>>; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });

  const dispatch = useAppDispatch();

  return (
    <div className="d-flex gap-4" style={isMobile ? { marginLeft: '2.77rem' } : {}}>
      <CartControl id={item.item.id} deleted={item.item.deleted} width={width} setCartList={setCartList} />
      <div className="d-flex gap-3">
        <button className="icon-button" type="button" onClick={() => dispatch(removeCartItem(item.id))} title={t('delete')}>
          <DeleteOutlined className="icon fs-5" />
          <span className="visually-hidden">{t('delete')}</span>
        </button>
        <Favorites id={item.item.id} className="fs-5" outlined={true} />
      </div>
    </div>
  );
};

const Cart = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { cart } = useAppSelector((state) => state.cart);

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const defaultDelivery: CreateOrderInterface['delivery'] = {
    price: 0,
    locality: '',
    street: '',
    house: '',
    address: '',
    platformStationFrom: '',
    platformStationTo: '',
    type: undefined,
  };

  const [cartList, setCartList] = useState<CartItemInterface[]>([]);
  const [selectPromotionField, setSelectPromotionField] = useState(false);
  const [promotional, setPromotional] = useState<PromotionalInterface>();
  const [deliveryList, setDeliveryList] = useState<CheckboxGroupProps['options']>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryTypeEnum>();
  const [deliveryButton, setDeliveryButton] = useState(false);
  const [isOpenDeliveryWidget, setIsOpenDeliveryWidget] = useState(false);
  const [delivery, setDelivery] = useState(defaultDelivery);
  const [yandexPlatformStation, setYandexPlatformStation] = useState<string>('');

  const { count, price: preparedPrice } = cartList.reduce((acc, cartItem) => {
    acc.price += (cartItem.item.price - cartItem.item.discountPrice) * cartItem.count;
    acc.count += cartItem.count;
    return acc;
  }, { count: 0, price: 0 });

  const countCart = cart.reduce((acc, cartItem) => acc + cartItem.count, 0);

  const price = Math.floor(preparedPrice);

  const totalPrice = price + delivery.price;

  const filteredCart = cart.filter(({ item }) => !item.deleted);

  const isFull = cartList.length === filteredCart.length;
  const indeterminate = cartList.length > 0 && cartList.length < filteredCart.length;

  const coefficient = 1.3;

  const width = 130;
  const height = width * coefficient;

  const [form] = Form.useForm();

  const onChange = (cartItems: CartItemInterface[]) => {
    setCartList(cartItems);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = async ({ target }) => {
    setCartList(target.checked ? filteredCart : []);
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

  const openYanderDeliveryWidget = (items: CartItemInterface[], platformStation?: string) => {
    window.YaDelivery.createWidget({
      containerId: 'delivery-widget',
      params: {
        city: 'Москва',
        size: {
          height: '500px',
          width: '100%',
        },
        source_platform_station: platformStation,
        physical_dims_weight_gross: items.length * 200,
        delivery_price: (value: number) => {
          setDelivery((state) => ({ ...state, price: value }));
          return `${value} руб`;
        },
        delivery_term: 1,
        show_select_button: true,
        filter: {
          type: ['pickup_point', 'terminal'],
          is_yandex_branded: true,
          payment_methods: ['already_paid'],
          payment_methods_filter: 'and',
        },
      },
    });
  };

  const resetPVZ = () => {
    setDeliveryButton(false);
    setDelivery(defaultDelivery);
    setDeliveryType(undefined);
  };

  const onFinish = async () => {
    setIsSubmit(true);
    const { payload: { code, order } } = await dispatch(createOrder({ cart: cartList, promotional, delivery })) as { payload: OrderResponseInterface; };
    if (code === 1) {
      const ids = cartList.map(({ id }) => id);
      dispatch(removeMany(ids));
      setCartList(cartList.filter(({ id }) => !ids.includes(id)));
      form.resetFields();
      setPromotional(undefined);
      resetPVZ();
      router.push(`${routes.orderHistory}/${order.id}`);
      toast(tToast('orderCreateSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    setCartList(filteredCart);
    axios.get<{ code: number; deliveryList: DeliveryCredentialsEntity[]; }>(routes.delivery.findMany)
      .then(({ data }) => {
        setDeliveryList(data.deliveryList.map(({ name, type }) => ({ label: name, value: type })));
        setYandexPlatformStation(data.deliveryList.find(({ type }) => type === DeliveryTypeEnum.YANDEX_DELIVERY)?.password ?? '');
      })
      .catch((e) => axiosErrorHandler(e, tToast));
  }, []);

  useEffect(() => {
    const handlePointSelected = (data: any) => {
      const detail = data.detail as YandexDeliveryDataInterface;
      setDelivery((state) => ({
        ...state,
        locality: detail.address.locality,
        street: detail.address.street,
        house: detail.address.house,
        address: `${detail.address.locality}, ${detail.address.street}, ${detail.address.house}`,
        platformStationFrom: yandexPlatformStation,
        platformStationTo: detail.id,
        type: deliveryType,
      }));
      setIsOpenDeliveryWidget(false);
    };

    document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);

    document.addEventListener('YaNddWidgetPointSelected', handlePointSelected);
  
    return () => {
      document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);
    };
  }, [yandexPlatformStation, deliveryType]);

  useEffect(() => {
    if (isOpenDeliveryWidget) {
      openYanderDeliveryWidget(cartList, yandexPlatformStation);
    }
  }, [isOpenDeliveryWidget, yandexPlatformStation]);

  useEffect(() => {
    setDeliveryButton(!!deliveryType);
  }, [deliveryType]);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '30%' : '12%' }}>
      <Helmet title={t('title', { count: countCart })} description={t('description')} />
      <Modal
        width={'100%'}
        centered
        zIndex={10000}
        open={isOpenDeliveryWidget}
        footer={null}
        onCancel={() => setIsOpenDeliveryWidget(false)}
      >
        <div id="delivery-widget" />
      </Modal>
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5">{t('title', { count: countCart })}</h1>
      <Form name="cart" className="d-flex flex-column flex-xl-row col-12 gap-3 large-input font-oswald" onFinish={onFinish} form={form}>
        <div className="d-flex flex-column justify-content-center align-items-between col-12 col-xl-8 mb-5 mb-xl-0">
          <Checkbox className={cn('mb-4', { 'not-padding': isMobile })} indeterminate={indeterminate} onChange={onCheckAllChange} checked={isFull}>
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
                <List.Item className={cn({ 'd-flex flex-column align-items-start gap-3': isMobile })}>
                  <div className="d-flex gap-3" style={isMobile ? {} : { height }}>
                    <Checkbox className={cn({ 'opacity-50': item.item.deleted, 'not-padding': isMobile })} value={item} {...(item.item.deleted ? { checked: false, disabled: true } : {})}>
                      <ImageHover
                        className="ms-3"
                        height={height}
                        width={width}
                        style={{ borderRadius: 7 }}
                        images={item.item?.images ?? []}
                      />
                    </Checkbox>
                    <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
                      <Link href={getHref(item.item)} className={cn('d-flex flex-column gap-3', { 'opacity-50': item.item.deleted })}>
                        <span className="lh-1">{item.item.name}</span>
                        <span>{tPrice('price', { price: (item.item.price - item.item.discountPrice) * item.count })}</span>
                      </Link>
                      {!isMobile ? <ControlButtons item={item} setCartList={setCartList} /> : null}
                    </div>
                  </div>
                  {isMobile ? <ControlButtons item={item} isMobile={isMobile} width={width} setCartList={setCartList} /> : null}
                </List.Item>
              )}
            />
          </Checkbox.Group>
        </div>
        <div className="col-12 col-xl-4">
          <h3 className="mb-4 text-uppercase">{t('deliveryType')}</h3>
          <Radio.Group size="large" disabled={!cartList.length} className="mb-4" options={deliveryList} value={deliveryType} onChange={({ target }) => setDeliveryType(target.value)} />
          {deliveryButton
            ? delivery.locality
              ? <Button className="button mx-auto mb-4" onClick={resetPVZ}>{t('resetPVZ')}</Button>
              : <Button className="button mx-auto mb-4" onClick={() => setIsOpenDeliveryWidget(true)}>{t('selectPVZ')}</Button>
            : null}
          {delivery.locality
            ? (
              <div className="d-flex flex-column fs-5 mb-3" style={{ fontWeight: 300 }}>
                <span className="text-uppercase fw-bold">{t('selectedPVZ.title')}</span>
                <span>{t('selectedPVZ.address', { address: delivery.address })}</span>
              </div>
            )
            : null}
          <div className="d-flex justify-content-between fs-5 mb-2" style={{ fontWeight: 300 }}>
            <span>{t('itemCount', { count })}</span>
            <span>{tPrice('price', { price })}</span>
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4" style={{ fontWeight: 300 }}>
            <span>{t('delivery')}</span>
            <span>{tPrice('price', { price: delivery.price })}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center fs-5 mb-4" style={{ fontWeight: 300 }}>
            <span>{t('promotional')}</span>
            {promotional
              ? <div className="d-flex">
                <Tag color="green" className="d-flex align-items-center fs-6 py-1" closeIcon={<CloseOutlined className="fs-6-5" />} onClose={onPromotionalRemove}>{t('promotionalName', { name: promotional.name })}</Tag>
                <span>{t('promotionalDiscount', { discount: getDiscount(totalPrice, promotional) })}</span>
              </div>
              : <Form.Item name="promotional" className="large-input mb-0">
                <Input disabled={!filteredCart.length} onSelect={() => setSelectPromotionField(true)} placeholder={t('promotional')} className="not-padding" size="large" onBlur={onPromotional} />
              </Form.Item>}
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4 text-uppercase fw-bold">
            <span>{t('total')}</span>
            <span>{tPrice('price', { price: getPrice(totalPrice, promotional) })}</span>
          </div>
          <Button disabled={selectPromotionField || !filteredCart.length} className="button w-100" htmlType="submit">{t('submitPay')}</Button>
        </div>
      </Form>
    </div>
  );
};

export default Cart;
