import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, List, Input, Tag, Modal, Radio } from 'antd';
import { CloseOutlined, DeleteOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import cn from 'classnames';
import axios from 'axios';
import type { CheckboxProps } from 'antd/lib';
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
import { newOrderPositionValidation, signupValidation } from '@/validations/validations';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { routes } from '@/routes';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import { getOrderPrice, getOrderDiscount } from '@/utilities/order/getOrderPrice';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { fetchConfirmCode, setRefreshToken } from '@/slices/userSlice';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { PromotionalInterface, PromotionalResponseInterface } from '@/types/promotional/PromotionalInterface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import type { CreateOrderInterface, OrderInterface } from '@/types/order/Order';
import type { UserSignupInterface } from '@/types/user/User';
import type { YandexDeliveryDataInterface } from '@/types/delivery/yandex.delivery.interface';
import type { RussianPostDeliveryDataInterface } from '@/types/delivery/russian.post.delivery.interface';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';

const ControlButtons = ({ item, isMobile, width, setCartList }: { item: CartItemInterface; isMobile?: boolean; width?: number; setCartList: React.Dispatch<React.SetStateAction<CartItemInterface[]>>; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });

  const dispatch = useAppDispatch();

  const remove = () => {
    dispatch(removeCartItem(item.id));
    setCartList((state) => state.filter(({ id }) => id !== item.id));
  };

  return (
    <div className="d-flex gap-4" style={isMobile ? { marginLeft: '2.77rem' } : {}}>
      <CartControl id={item.item.id} width={width} setCartList={setCartList} />
      <div className="d-flex gap-3">
        <button className="icon-button" type="button" onClick={remove} title={t('delete')}>
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

  const { name, phone, key, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { cart } = useAppSelector((state) => state.cart);

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const defaultDelivery: CreateOrderInterface['delivery'] = {
    price: 0,
    address: '',
    type: undefined,
    indexTo: undefined,
    mailType: undefined,
  };

  const [cartList, setCartList] = useState<CartItemInterface[]>([]);
  const [selectPromotionField, setSelectPromotionField] = useState(false);
  const [promotional, setPromotional] = useState<PromotionalInterface>();
  const [deliveryList, setDeliveryList] = useState<CheckboxGroupProps['options']>([]);
  const [deliveryServices, setDeliveryServices] = useState<Pick<DeliveryCredentialsEntity, 'translations' | 'type'>[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryTypeEnum>();
  const [savedDeliveryPrice, setSavedDeliveryPrice] = useState(0);
  const [deliveryButton, setDeliveryButton] = useState(false);
  const [isOpenDeliveryWidget, setIsOpenDeliveryWidget] = useState(false);
  const [delivery, setDelivery] = useState(defaultDelivery);
  const [user, setUser] = useState<Pick<UserSignupInterface, 'name' | 'phone' | 'lang'>>({ name: '', phone: '', lang: lang as UserLangEnum });
  const [tempUser, setTempUser] = useState<Pick<UserSignupInterface, 'name' | 'phone' | 'lang'>>({ name: '', phone: '', lang: lang as UserLangEnum });

  const [isProcessConfirmed, setIsProcessConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const positions = cartList.map(({ item, count }) => ({ price: item.price, discountPrice: item.discountPrice, count, item }));

  const getPreparedOrder = (items: OrderPositionInterface[], deliveryPrice: number, promo?: PromotionalInterface) => ({ positions: items, deliveryPrice, promotional: promo }) as OrderInterface;

  const count = cartList.reduce((acc, cartItem) => acc + cartItem.count, 0);
  const countCart = cart.reduce((acc, cartItem) => acc + cartItem.count, 0);

  const priceForFreeDelivery = 10000;

  const price = getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], 0));

  const filteredCart = cart.filter(({ item }) => !item.deleted);

  const isFull = cartList.length === filteredCart.length;
  const indeterminate = cartList.length > 0 && cartList.length < filteredCart.length;

  const coefficient = 1.3;

  const width = 130;
  const height = width * coefficient;

  const [form] = Form.useForm();

  const onPromotionalRemove = () => {
    if (promotional && promotional.freeDelivery) {
      setDelivery((state) => ({ ...state, price: savedDeliveryPrice }));
    }
    setPromotional(undefined);
    form.setFieldValue('promotional', undefined);
  };

  const onCheckAllChange: CheckboxProps['onChange'] = async ({ target }) => {
    setCartList(target.checked ? filteredCart : []);
  };

  const onPromotional = async () => {
    try {
      const value = form.getFieldValue('promotional');
      if (!value) {
        return;
      }
      setIsSubmit(true);
      const { data } = await axios.get<PromotionalResponseInterface>(routes.promotional.findOneByName, { params: { name: value, cartIds: cartList.map(({ id }) => id) } });
      if (data.code === 1) {
        setPromotional(data.promotional);
        if (data.promotional.freeDelivery) {
          setDelivery((state) => ({ ...state, price: 0 }));
        }
        setSelectPromotionField(false);
        toast(tToast('addPromotionalSuccess', { name: data.promotional.name }), 'success');
      } else if ([2, 3, 4].includes(data.code)) {
        let validationCode = '';

        switch (data.code) {
        case 2:
          validationCode = 'promotionalNotExist';
          break;
        case 3:
          validationCode = 'promotionalExpired';
          break;
        case 4:
          validationCode = 'promotionalConditionsNotMet';
          break;
        }
        form.setFields([{ name: 'promotional', errors: [tValidation(validationCode)] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const openYanderDeliveryWidget = (items: CartItemInterface[]) => {
    window.YaDelivery.createWidget({
      containerId: 'delivery-widget',
      params: {
        city: 'Москва',
        size: {
          height: '500px',
          width: '90vw',
        },
        // source_platform_station: 'ca56c850-d268-4c9e-9e52-5dc09b006a7d',
        physical_dims_weight_gross: items.length * 200,
        delivery_price: '300 руб',
        delivery_term: lang === UserLangEnum.RU ? 'от 2 до 7 дней' : 'from 2 to 7 days',
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

  const openRussianPostDeliveryWidget = (items: CartItemInterface[]) => {
    window.ecomStartWidget({
      id: 55091,
      weight: items.length * 200,
      sumoc: getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], delivery.price, promotional)),
      callbackFunction: (result: RussianPostDeliveryDataInterface) => {
        setSavedDeliveryPrice(result.cashOfDelivery / 100);
        setDelivery({
          price: (promotional && promotional.freeDelivery) || (getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], 0, promotional)) >= priceForFreeDelivery) ? 0 : result.cashOfDelivery / 100,
          address: `${result.cityTo}, ${result.addressTo}`,
          type: deliveryType,
          indexTo: result.indexTo,
          mailType: result.mailType,
        });
        setIsOpenDeliveryWidget(false);
      },
      containerId: 'ecom-widget',
    });
  };

  const resetPVZ = () => {
    setDeliveryButton(false);
    setDelivery(defaultDelivery);
    setSavedDeliveryPrice(0);
    setDeliveryType(undefined);
  };

  const onFinish = async (values: Pick<UserSignupInterface, 'name' | 'phone' | 'lang'> & { comment: string; }) => {
    setIsSubmit(true);
    if (!delivery.address) {
      toast(tValidation('notSelectedPVZ'), 'error');
    }
    if (!name && !user.phone) {
      const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: values.phone, key })) as { payload: { code: number } };
      if (code === 1) {
        setIsProcessConfirmed(true);
        setTempUser({ name: values.name, phone: values.phone, lang: lang as UserLangEnum });
      }
      if (code === 4) {
        toast(tToast('timeNotOverForSms'), 'error');
      }
      if (code === 5) {
        form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
      }
    } else {
      const { payload: { code, url, refreshToken } } = await dispatch(createOrder({ cart: cartList, promotional, delivery, comment: values.comment, user: { name: name || values.name, phone: phone || values.phone, lang: lang || values.lang  }  })) as { payload: OrderResponseInterface & { url: string; refreshToken?: string; }; };
      if (code === 1) {
        const ids = cartList.map(({ id }) => id);
        dispatch(removeMany(ids));
        setCartList(cartList.filter(({ id }) => !ids.includes(id)));
        if (refreshToken) {
          dispatch(setRefreshToken(refreshToken));
        }
        form.resetFields();
        setPromotional(undefined);
        resetPVZ();
        router.push(url);
        toast(tToast('orderCreateSuccess'), 'success');
      }
    }

    setIsSubmit(false);
  };

  const promotionalValue = Form.useWatch('promotional', form);

  useEffect(() => {
    setSelectPromotionField(!!promotionalValue);
  }, [promotionalValue]);

  useEffect(() => {
    setCartList(filteredCart);
    axios.get<{ code: number; deliveryList: DeliveryCredentialsEntity[]; }>(routes.delivery.findMany)
      .then(({ data }) => {
        setDeliveryServices(data.deliveryList);
      })
      .catch((e) => axiosErrorHandler(e, tToast));
  }, []);

  useEffect(() => {
    if (lang && deliveryServices.length) {
      setDeliveryList(deliveryServices.map((list) => ({ label: list.translations.find((translation) => translation.lang === lang)?.name, value: list.type })));
    }
  }, [lang, deliveryServices]);

  useEffect(() => {
    const handlePointSelected = (data: any) => {
      const detail = data.detail as YandexDeliveryDataInterface;
      setSavedDeliveryPrice(300);
      setDelivery({
        price: (promotional && promotional.freeDelivery) || (getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], 0, promotional)) >= priceForFreeDelivery) ? 0 : 300,
        address: `${detail.address.locality}, ${detail.address.street}, ${detail.address.house}`,
        type: deliveryType,
      });
      setIsOpenDeliveryWidget(false);
    };

    document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);
    document.addEventListener('YaNddWidgetPointSelected', handlePointSelected);
  
    return () => {
      document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);
    };
  }, [deliveryType]);

  useEffect(() => {
    if (isOpenDeliveryWidget) {
      switch (deliveryType) {
      case DeliveryTypeEnum.YANDEX_DELIVERY:
        openYanderDeliveryWidget(cartList);
        break;
      case DeliveryTypeEnum.RUSSIAN_POST:
        openRussianPostDeliveryWidget(cartList);
        break;
      }
    }
  }, [isOpenDeliveryWidget, deliveryType]);

  useEffect(() => {
    setDeliveryButton(!!deliveryType);
  }, [deliveryType]);

  useEffect(() => {
    if (isConfirmed && tempUser.phone) {
      setUser(tempUser);
      setIsProcessConfirmed(false);
    }
  }, [isConfirmed, tempUser.phone]);

  useEffect(() => {
    if (promotional?.items?.length) {
      const cartItemIds = cartList.map(({ item }) => item.id);

      if (!promotional.items.some(({ id }) => cartItemIds.includes(id))) {
        onPromotionalRemove();
      }
    }
    setDelivery((state) => ({ ...state, price: (promotional && promotional.freeDelivery) || (getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], 0, promotional)) >= priceForFreeDelivery) ? 0 : savedDeliveryPrice }));
  }, [count, promotional]);

  return (
    <div className="d-flex flex-column" style={{ marginTop: isMobile ? '100px' : '150px' }}>
      <Helmet title={t('title', { count: countCart })} description={t('description')} />
      {isProcessConfirmed
        ? (
          <Modal
            width={'100%'}
            centered
            zIndex={10000}
            open
            footer={null}
            onCancel={() => setIsProcessConfirmed(false)}
          >
            <ConfirmPhone setState={setIsConfirmed} />
          </Modal>
        )
        : null}
      <Modal
        width={'100%'}
        centered
        zIndex={10000}
        open={isOpenDeliveryWidget}
        footer={null}
        onCancel={() => {
          resetPVZ();
          setIsOpenDeliveryWidget(false);
        }}
      >
        <>
          <div id="delivery-widget" style={deliveryType !== DeliveryTypeEnum.YANDEX_DELIVERY ? { display: 'none' } : {}} />
          <div id="ecom-widget" style={{ height: 500, ...(deliveryType !== DeliveryTypeEnum.RUSSIAN_POST ? { display: 'none' } : {}) }} />
        </>
      </Modal>
      <h1 className="font-good-vibes-pro text-center mb-5">{t('title', { count: countCart })}</h1>
      <Form name="cart" className="d-flex flex-column flex-xl-row col-12 gap-3 large-input font-oswald" onFinish={onFinish} form={form} initialValues={{ ...user, comment: '' }}>
        <div className="d-flex flex-column align-items-between col-12 col-xl-8 mb-5 mb-xl-0">
          <Checkbox className={cn('mb-4', { 'not-padding': isMobile })} indeterminate={indeterminate} onChange={onCheckAllChange} checked={isFull}>
            {t('checkAll')}
          </Checkbox>
          <Checkbox.Group value={cartList} onChange={setCartList}>
            <List
              dataSource={cart}
              className="w-100"
              locale={{
                emptyText: <NotFoundContent text={t('notFoundContent')} />,
              }}
              renderItem={(item) => (
                <List.Item className={cn({ 'd-flex flex-column align-items-start gap-1': isMobile })}>
                  <div className="d-flex gap-xl-3" style={isMobile ? {} : { height }}>
                    <Checkbox className={cn({ 'not-padding': isMobile })} value={item} {...(item.item.deleted ? { checked: false, disabled: true } : {})}>
                      <ImageHover
                        className="ms-3"
                        height={height}
                        width={width}
                        deleted={!!item.item.deleted}
                        style={{ borderRadius: 7 }}
                        images={item.item?.images ?? []}
                      />
                    </Checkbox>
                    <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
                      <Link href={getHref(item.item)} className={cn('d-flex flex-column gap-3', { 'opacity-50': item.item.deleted })}>
                        <span className="lh-1">{item.item.translations.find((translation) => translation.lang === lang)?.name}</span>
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
          <Radio.Group size="large" disabled={!cartList.length} className="mb-4 border-0" options={deliveryList} value={deliveryType} onChange={({ target }) => setDeliveryType(target.value)} />
          {deliveryButton
            ? delivery.address
              ? <Button className="button mx-auto mb-4" onClick={resetPVZ}>{t('resetPVZ')}</Button>
              : <Button className="button mx-auto mb-4" onClick={() => setIsOpenDeliveryWidget(true)}>{t('selectPVZ')}</Button>
            : null}
          {delivery.address
            ? (
              <div className="d-flex flex-column fs-5 mb-4 fw-300">
                <span className="text-uppercase fw-bold">{t('selectedPVZ.title')}</span>
                <span>{t('selectedPVZ.address', { address: delivery.address })}</span>
              </div>
            )
            : null}
          {!name ? (
            <>
              <Form.Item<UserSignupInterface> name="name" rules={[signupValidation]}>
                <Input size="small" prefix={<UserOutlined />} placeholder={t('name')} disabled={!!user?.name} />
              </Form.Item>
              <Form.Item<UserSignupInterface> name="phone" rules={[signupValidation]}>
                <MaskedInput size="small" mask="+7 (000) 000-00-00" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} disabled={!!user?.phone} />
              </Form.Item>
            </>
          ) : null}
          <Form.Item<CreateOrderInterface['comment']> name="comment" className="custom-placeholder" rules={[newOrderPositionValidation]}>
            <Input.TextArea rows={3} className="border border-secondary" size="small" variant="borderless" placeholder={t('comment')} />
          </Form.Item>
          <div className="d-flex justify-content-between fs-5 mb-2 fw-300">
            <span>{t('itemCount', { count })}</span>
            <span>{tPrice('price', { price })}</span>
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4 fw-300">
            <span>{t('delivery')}</span>
            <span>{(promotional && promotional.freeDelivery) || (getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], 0, promotional)) >= priceForFreeDelivery) ? t('free') : tPrice('price', { price: delivery.price })}</span>
          </div>
          <div className="d-flex justify-content-between align-items-center fs-5 mb-4 fw-300" style={{ color: '#ff9500' }}>
            <span>{t('promotional')}</span>
            {promotional
              ? <div className="d-flex">
                <Tag color="green" className="d-flex align-items-center fs-6 py-1" closeIcon={<CloseOutlined className="fs-6-5" />} onClose={onPromotionalRemove}>{t('promotionalName', { name: promotional.name })}</Tag>
                <span>{t('promotionalDiscount', { discount: promotional && promotional.freeDelivery ? savedDeliveryPrice : getOrderDiscount(getPreparedOrder(positions as OrderPositionInterface[], delivery.price, promotional)) })}</span>
              </div>
              : <Form.Item name="promotional" className="large-input mb-0">
                <Input disabled={!filteredCart.length || !delivery.address} placeholder={t('promotional')} className="not-padding" size="large" />
              </Form.Item>}
          </div>
          <div className="d-flex justify-content-between fs-5 mb-4 text-uppercase fw-bold">
            <span>{t('total')}</span>
            <span>{tPrice('price', { price: getOrderPrice(getPreparedOrder(positions as OrderPositionInterface[], delivery.price, promotional)) })}</span>
          </div>
          {selectPromotionField
            ? <Button disabled={!filteredCart.length || !delivery.address || !count || isSubmit} className="button w-100 mb-3" onClick={onPromotional}>{t('acceptPromotional')}</Button>
            : <Button disabled={!filteredCart.length || !delivery.address || !count || isSubmit} className="button w-100 mb-3" htmlType="submit">{t(!name && !user.phone ? 'confirmPhone' : 'submitPay')}</Button>
          }
          <p className="text-muted text-center">{t('accept', { submitButton: t(!name && !user.phone ? 'confirmPhone' : 'submitPay') })}<Link className="text-primary fw-light" href={routes.page.base.privacyPolicy} title={t('policy')}>{t('policy')}</Link></p>
        </div>
      </Form>
    </div>
  );
};

export default Cart;
