import { useContext, useEffect, useMemo, useState, useEffectEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, DatePicker, Form, Input, Modal, Tag } from 'antd';
import { CloseOutlined, DeleteOutlined, HeartFilled, HeartOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';
import moment, { type Moment } from 'moment';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import cn from 'classnames';
import axios from 'axios';
import type { CheckboxProps } from 'antd/lib';

import { locale } from '@/locales/pickers.locale.ru';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { ImageHover } from '@/components/ImageHover';
import { removeMany, removeCartItem } from '@/slices/cartSlice';
import { addFavorites, removeFavorites, fetchConfirmCode, setRefreshToken } from '@/slices/userSlice';
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
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { useCartItem } from '@/themes/v2/hooks/useCartItem';
import styles from '@/themes/v2/components/cart/V2CartPage.module.scss';
import type { PromotionalInterface, PromotionalResponseInterface } from '@/types/promotional/PromotionalInterface';
import type { CartItemInterface } from '@/types/cart/Cart';
import type { DeliveryCredentialsEntity } from '@server/db/entities/delivery.credentials.entity';
import type { CreateOrderInterface, OrderInterface } from '@/types/order/Order';
import type { UserSignupInterface } from '@/types/user/User';
import type { YandexDeliveryDataInterface } from '@server/types/delivery/yandex/yandex.delivery.interface';
import type { RussianPostDeliveryDataInterface } from '@server/types/delivery/russian.post.delivery.interface';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';
import type { CDEKDeliveryDataType } from '@server/types/delivery/cdek/cdek-delivery.interface';

const YANDEX_MAPS_API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY as string;
const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

// ── Qty stepper inside the item row ──────────────────────────────────────────
const ItemQtyControl = ({ itemId }: { itemId: number }) => {
  const { inCart, handleIncrement, handleDecrement } = useCartItem(itemId);
  if (!inCart) return null;

  return (
    <div className={styles.qty}>
      <button className={styles.qtyBtn} type="button" onClick={handleDecrement}>−</button>
      <span className={styles.qtyVal}>{inCart.count}</span>
      <button className={styles.qtyBtn} type="button" onClick={handleIncrement}>+</button>
    </div>
  );
};

// ── Cart item row ─────────────────────────────────────────────────────────────
const CartItemRow = ({
  item,
  lang,
  width,
  height,
  setCartList,
}: {
  item: CartItemInterface;
  lang: string;
  width: number;
  height: number;
  setCartList: React.Dispatch<React.SetStateAction<CartItemInterface[]>>;
}) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);

  const { id: userId, favorites } = useAppSelector((state) => state.user);
  const inFavorites = favorites?.find((fav) => fav.id === item.item.id);

  const isDisabled = !!(item.item.deleted || item.item.outStock);
  const name = item.item.translations.find((tr) => tr.lang === lang)?.name ?? '';
  const groupName = item.item.group?.translations?.find((tr: any) => tr.lang === lang)?.name ?? '';
  const unitPrice = item.item.price - item.item.discountPrice;
  const totalPrice = unitPrice * item.count;

  const remove = () => {
    dispatch(removeCartItem(item.id));
    setCartList((state) => state.filter(({ id }) => id !== item.id));
  };

  const toggleFavorite = async () => {
    setIsSubmit(true);
    await dispatch(inFavorites ? removeFavorites(inFavorites.id) : addFavorites(item.item.id));
    setIsSubmit(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDisabled) return;
    if ((e.target as HTMLElement).closest('a, button')) return;
    setCartList((prev) =>
      prev.some(({ id }) => id === item.id)
        ? prev.filter(({ id }) => id !== item.id)
        : [...prev, item],
    );
  };

  return (
    <div
      className={cn(styles.item, { [styles.itemDisabled]: isDisabled })}
      onClick={handleCardClick}
    >

      {/* col 1 — checkbox (desktop) */}
      <div className={styles.itemCheckbox}>
        <Checkbox value={item} {...(isDisabled ? { checked: false, disabled: true } : {})} />
      </div>

      {/* col 2 — image + checkbox overlay (mobile) */}
      <div className={styles.itemImageWrap}>
        <Link href={getHref(item.item)} className={styles.itemImage} tabIndex={-1}>
          <ImageHover
            height={height}
            width={width}
            style={{ borderRadius: 10, display: 'block' }}
            images={item.item?.images ?? []}
          />
        </Link>
        <div className={styles.itemCheckboxMobile}>
          <Checkbox value={item} {...(isDisabled ? { checked: false, disabled: true } : {})} />
        </div>
      </div>

      {/* col 3 — name + meta + mobile controls */}
      <div className={styles.itemInfo}>
        <div className={styles.itemInfoTop}>
          {groupName && <span className={styles.itemEyebrow}>{groupName}</span>}
          <div className={styles.itemNameRow}>
            <Link
              href={getHref(item.item)}
              className={cn(styles.itemName, { [styles.disabled]: isDisabled })}
            >
              {name}
            </Link>
            {item.item.outStock && <span className={cn(styles.badge, styles.outStock)}>{t('isAbsent', { date: '' }).replace(/\s*до\s*$/, '').trim()}</span>}
            {item.item.deleted  && <span className={cn(styles.badge, styles.deleted)}>{t('deleted')}</span>}
          </div>
          <span className={styles.itemPriceMobile}>{tPrice('price', { price: totalPrice })}</span>
        </div>
        <div className={styles.itemMobileRow}>
          {!isDisabled && <ItemQtyControl itemId={item.item.id} />}
          <button className={cn(styles.iconBtn, styles.danger)} type="button" onClick={remove} title={t('delete')}>
            <DeleteOutlined />
          </button>
          {userId && (
            <button
              className={cn(styles.iconBtn, { [styles.favActive]: !!inFavorites })}
              type="button"
              onClick={toggleFavorite}
              title={t('favorites')}
            >
              {inFavorites ? <HeartFilled /> : <HeartOutlined />}
            </button>
          )}
        </div>
      </div>

      {/* col 4 — price zone (desktop only) */}
      <div className={styles.itemPriceZone}>
        {item.count > 1 && (
          <span className={styles.itemPriceUnit}>
            {tPrice('price', { price: unitPrice })} × {item.count}
          </span>
        )}
        <span className={styles.itemPriceTotal}>{tPrice('price', { price: totalPrice })}</span>
      </div>

      {/* col 5 — qty stepper (desktop only) */}
      <div className={styles.itemQty}>
        {!isDisabled && <ItemQtyControl itemId={item.item.id} />}
      </div>

      {/* col 6 — actions (desktop only) */}
      <div className={styles.itemActions}>
        <button className={cn(styles.iconBtn, styles.danger)} type="button" onClick={remove} title={t('delete')}>
          <DeleteOutlined />
        </button>
        {userId && (
          <button
            className={cn(styles.iconBtn, { [styles.favActive]: !!inFavorites })}
            type="button"
            onClick={toggleFavorite}
            title={t('favorites')}
          >
            {inFavorites ? <HeartFilled /> : <HeartOutlined />}
          </button>
        )}
      </div>

    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
export const V2CartPage = () => {
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

  const cdekWidgetRef = useRef<{ app: { mount: () => void } }>(null);

  const defaultDelivery: CreateOrderInterface['delivery'] = { price: 0, address: '' };

  const filteredCart = useMemo(() => cart.filter(({ item }) => !(item.deleted || item.outStock)), [cart]);

  const [cartList, setCartList] = useState<CartItemInterface[]>(filteredCart);
  const [promotional, setPromotional] = useState<PromotionalInterface>();
  const [deliveryServices, setDeliveryServices] = useState<Pick<DeliveryCredentialsEntity, 'translations' | 'type'>[]>([]);
  const [deliveryType, setDeliveryType] = useState<DeliveryTypeEnum>();
  const [savedDeliveryPrice, setSavedDeliveryPrice] = useState(0);
  const [isOpenDeliveryWidget, setIsOpenDeliveryWidget] = useState(false);
  const [delivery, setDelivery] = useState(defaultDelivery);
  const [user, setUser] = useState<Pick<UserSignupInterface, 'name' | 'phone' | 'lang'>>({ name: '', phone: '', lang: lang as UserLangEnum });
  const [tempUser, setTempUser] = useState<Pick<UserSignupInterface, 'name' | 'phone' | 'lang'>>({ name: '', phone: '', lang: lang as UserLangEnum });
  const [isProcessConfirmed, setIsProcessConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const setUserEffect = useEffectEvent(setUser);
  const setDeliveryEffect = useEffectEvent(setDelivery);
  const setPromotionalEffect = useEffectEvent(setPromotional);
  const setIsProcessConfirmedEffect = useEffectEvent(setIsProcessConfirmed);

  const deliveryList = useMemo(
    () => deliveryServices.map((s) => ({
      label: s.translations.find((tr) => tr.lang === lang)?.name,
      value: s.type,
    })),
    [lang, deliveryServices],
  );

  const positions = cartList.map(({ id, item, count }) => ({ id, price: item.price, discountPrice: item.discountPrice, count, item })) as unknown as OrderPositionInterface[];
  const getPreparedOrder = (items: OrderPositionInterface[], deliveryPrice: number, promo?: PromotionalInterface) => ({ positions: items, deliveryPrice, promotional: promo }) as OrderInterface;

  const count = cartList.reduce((acc, ci) => acc + ci.count, 0);
  const countCart = cart.reduce((acc, ci) => acc + ci.count, 0);
  const priceForFreeDelivery = 10000;
  const price = getOrderPrice(getPreparedOrder(positions, 0));

  const isFull = cartList.length === filteredCart.length;
  const indeterminate = cartList.length > 0 && cartList.length < filteredCart.length;

  const width = isMobile ? 80 : 100;
  const height = Math.round(width * 1.3);

  const [form] = Form.useForm();

  const onCheckAllChange: CheckboxProps['onChange'] = ({ target }) => {
    setCartList(target.checked ? filteredCart : []);
  };

  const onPromotional = async () => {
    try {
      const value = form.getFieldValue('promotional');
      if (!value) return;
      setIsSubmit(true);
      const { data } = await axios.get<PromotionalResponseInterface>(routes.promotional.findOneByName, { params: { name: value, cartIds: cartList.map(({ id }) => id) } });
      if (data.code === 1) {
        setPromotional(data.promotional);
        if (data.promotional.freeDelivery) {
          setDelivery((state) => ({ ...state, price: 0 }));
        }
        toast(tToast('addPromotionalSuccess', { name: data.promotional.name }), 'success');
      } else if ([2, 3, 4, 5].includes(data.code)) {
        const map: Record<number, string> = { 2: 'promotionalNotExist', 3: 'promotionalExpired', 4: 'promotionalConditionsNotMet', 5: 'promotionalUsersNotMet' };
        form.setFields([{ name: 'promotional', errors: [tValidation(map[data.code])] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const openYandexDeliveryWidget = (items: CartItemInterface[]) => {
    window.YaDelivery.createWidget({
      containerId: 'delivery-widget',
      params: {
        city: 'Москва',
        size: { height: '500px', width: '90vw' },
        physical_dims_weight_gross: items.length * 200,
        delivery_price: '300 руб',
        delivery_term: lang === UserLangEnum.RU ? 'от 2 до 7 дней' : 'from 2 to 7 days',
        show_select_button: true,
        filter: { type: ['pickup_point'], is_yandex_branded: true, payment_methods: ['already_paid'], payment_methods_filter: 'and' },
      },
    });
  };

  const openRussianPostDeliveryWidget = (items: CartItemInterface[]) => {
    window.ecomStartWidget({
      id: 55091,
      weight: items.length * 200,
      sumoc: getOrderPrice(getPreparedOrder(positions, delivery.price, promotional)),
      callbackFunction: (result: RussianPostDeliveryDataInterface) => {
        setSavedDeliveryPrice(result.cashOfDelivery / 100);
        setDelivery({
          price: (promotional?.freeDelivery) || (getOrderPrice(getPreparedOrder(positions, 0, promotional)) >= priceForFreeDelivery) ? 0 : result.cashOfDelivery / 100,
          address: `${result.cityTo}, ${result.addressTo}`,
          type: deliveryType,
          index: result.indexTo,
          mailType: result.mailType,
        });
        setIsOpenDeliveryWidget(false);
      },
      containerId: 'ecom-widget',
    });
  };

  const openCDEKDeliveryWidget = (items: CartItemInterface[]) => {
    if (cdekWidgetRef?.current) {
      cdekWidgetRef.current.app.mount();
    } else {
      cdekWidgetRef.current = new window.CDEKWidget({
        from: 'Москва',
        apiKey: YANDEX_MAPS_API_KEY,
        canChoose: true,
        servicePath: routes.integration.cdek.root,
        hideFilters: { have_cashless: true, have_cash: true, is_dressing_room: true, type: false },
        goods: items.map(() => ({ width: 20, height: 20, length: 20, weight: 50 })),
        debug: false,
        defaultLocation: 'Москва',
        currency: 'RUB',
        lang: lang === UserLangEnum.EN ? 'eng' : 'rus',
        hideDeliveryOptions: { office: false, door: true },
        tariffs: { office: [136, 234, 291, 510, 368, 378, 185, 498, 2485], pickup: [136, 234, 291, 510, 368, 378, 185, 498, 2485] },
        popup: false,
        onChoose: (...params: CDEKDeliveryDataType) => {
          const [type, rate, address] = params;
          let compoundAddress = '';
          let code: string | undefined;

          if (type === 'office') {
            compoundAddress = [address.city, address.address].filter(Boolean).join(', ').trim();
            code = address.code;
          } else {
            compoundAddress = address.formatted;
          }

          setSavedDeliveryPrice(rate.delivery_sum);
          setDelivery({
            price: (promotional?.freeDelivery) || (getOrderPrice(getPreparedOrder(positions, 0, promotional)) >= priceForFreeDelivery) ? 0 : rate.delivery_sum,
            address: compoundAddress,
            type: deliveryType,
            cdekType: type,
            tariffName: rate.tariff_name,
            tariffDescription: rate.tariff_description,
            tariffCode: rate.tariff_code,
            deliveryFrom: rate.delivery_date_range?.min,
            deliveryTo: rate.delivery_date_range?.max,
            countryCode: address.country_code,
            platformStationTo: code,
            index: address.postal_code,
          });
          setIsOpenDeliveryWidget(false);
        },
      });
    }
  };

  const resetPVZ = () => {
    setDelivery(defaultDelivery);
    setSavedDeliveryPrice(0);
    setDeliveryType(undefined);
    form.setFieldsValue({ deliveryDateTime: undefined, telegramNickname: '' });
  };

  const sendOrderToYandex = (order: OrderInterface) => {
    if (typeof window !== 'undefined' && window.dataLayer) {
      window.dataLayer.push({
        ecommerce: {
          currencyCode: 'RUB',
          purchase: {
            actionField: { id: order.id.toString(), coupon: order.promotional?.name, goal_id: 511960192, revenue: getOrderPrice(order) - order.deliveryPrice },
            products: cartList.map(({ item, count: c }, index) => ({
              id: item.id.toString(),
              name: item.translations.find((tr) => tr.lang === lang)?.name as string,
              price: item.price - item.discountPrice,
              discount: item.discountPrice,
              quantity: c,
              position: index + 1,
            })),
          },
        },
      });
    }
  };

  const onFinish = async (values: Pick<UserSignupInterface, 'name' | 'phone' | 'lang'> & { comment: string; telegramNickname?: string; delivery?: { deliveryDateTime?: Moment }; }) => {
    setIsSubmit(true);
    if (!delivery.address) {
      toast(tValidation('notSelectedPVZ'), 'error');
      setIsSubmit(false);
      return;
    }
    const deliveryPayload: CreateOrderInterface['delivery'] = deliveryType === DeliveryTypeEnum.PICKUP
      ? { ...delivery, telegramNickname: values.telegramNickname ?? '', deliveryDateTime: values.delivery?.deliveryDateTime?.toISOString?.() }
      : delivery;

    if (!name && !user.phone) {
      const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: values.phone, key })) as { payload: { code: number } };
      if (code === 1) {
        setIsProcessConfirmed(true);
        setTempUser({ name: values.name, phone: values.phone, lang: lang as UserLangEnum });
      }
      if (code === 4) toast(tToast('timeNotOverForSms'), 'error');
      if (code === 5) form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
    } else {
      const { payload: { code, order, url, refreshToken } } = await dispatch(createOrder({ cart: cartList, promotional, delivery: deliveryPayload, comment: values.comment, user: { name: name || values.name, phone: phone || values.phone, lang: lang || values.lang } })) as { payload: OrderResponseInterface & { url: string; refreshToken?: string } };
      if (code === 1) {
        sendOrderToYandex(order);
        const ids = cartList.map(({ id }) => id);
        dispatch(removeMany(ids));
        setCartList(cartList.filter(({ id }) => !ids.includes(id)));
        if (refreshToken) dispatch(setRefreshToken(refreshToken));
        form.resetFields();
        setPromotional(undefined);
        resetPVZ();
        router.push(url);
        toast(tToast('orderCreateSuccess'), 'success');
      }
    }
    setIsSubmit(false);
  };

  const onDeliveryTypeChange = (value: DeliveryTypeEnum) => {
    resetPVZ();
    setDeliveryType(value);
    if (value === DeliveryTypeEnum.PICKUP) {
      setDelivery({ type: DeliveryTypeEnum.PICKUP, price: 0, address: t('pickupAddress') });
    }
  };

  const promotionalValue = Form.useWatch('promotional', form);
  const deliveryDateTimeValue = Form.useWatch(['delivery', 'deliveryDateTime'], form);
  const isPersonalDataConsent = Form.useWatch('personalDataConsent', form);
  const selectPromotionField = !!promotionalValue;

  const isDeliveryFree = (promotional?.freeDelivery) || (getOrderPrice(getPreparedOrder(positions, 0, promotional)) >= priceForFreeDelivery);
  const totalPrice = getOrderPrice(getPreparedOrder(positions, delivery.price, promotional));
  const isSubmitDisabled = !filteredCart.length || !delivery.address || !isPersonalDataConsent || !count || isSubmit || (deliveryType === DeliveryTypeEnum.PICKUP && !deliveryDateTimeValue);

  useEffect(() => {
    axios.get<{ code: number; deliveryList: DeliveryCredentialsEntity[] }>(routes.delivery.findMany)
      .then(({ data }) => setDeliveryServices(data.deliveryList))
      .catch((e) => axiosErrorHandler(e, tToast));
  }, []);

  useEffect(() => {
    const handlePointSelected = (data: any) => {
      const detail = data.detail as YandexDeliveryDataInterface;
      setSavedDeliveryPrice(300);
      setDelivery({
        price: isDeliveryFree ? 0 : 300,
        address: `${detail.address.locality}, ${detail.address.street}, ${detail.address.house}`,
        type: deliveryType,
      });
      setIsOpenDeliveryWidget(false);
    };
    document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);
    document.addEventListener('YaNddWidgetPointSelected', handlePointSelected);
    return () => document.removeEventListener('YaNddWidgetPointSelected', handlePointSelected);
  }, [deliveryType]);

  useEffect(() => {
    if (!isOpenDeliveryWidget) return;
    switch (deliveryType) {
    case DeliveryTypeEnum.YANDEX_DELIVERY: openYandexDeliveryWidget(cartList); break;
    case DeliveryTypeEnum.RUSSIAN_POST:    openRussianPostDeliveryWidget(cartList); break;
    case DeliveryTypeEnum.CDEK:            openCDEKDeliveryWidget(cartList); break;
    }
  }, [isOpenDeliveryWidget, deliveryType]);

  useEffect(() => {
    if (isConfirmed && tempUser.phone) {
      setUserEffect(tempUser);
      setIsProcessConfirmedEffect(false);
    }
  }, [isConfirmed, tempUser.phone]);

  useEffect(() => {
    if (promotional?.items?.length) {
      const cartItemIds = cartList.map(({ item }) => item.id);
      if (!promotional.items.some(({ id }) => cartItemIds.includes(id))) {
        if (promotional?.freeDelivery) setDeliveryEffect((state) => ({ ...state, price: savedDeliveryPrice }));
        setPromotionalEffect(undefined);
        form.setFieldValue('promotional', undefined);
      }
    }
    setDeliveryEffect((state) => ({ ...state, price: isDeliveryFree ? 0 : savedDeliveryPrice }));
  }, [count, promotional]);

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: countCart })} description={t('description')} />

      {isProcessConfirmed && (
        <Modal centered zIndex={10000} open footer={null} onCancel={() => setIsProcessConfirmed(false)}>
          <ConfirmPhone setState={setIsConfirmed} />
        </Modal>
      )}

      <Modal
        width="100%"
        centered
        zIndex={10000}
        open={isOpenDeliveryWidget}
        footer={null}
        onCancel={() => { resetPVZ(); setIsOpenDeliveryWidget(false); }}
      >
        <>
          <div id="delivery-widget" style={deliveryType !== DeliveryTypeEnum.YANDEX_DELIVERY ? { display: 'none' } : {}} />
          <div id="ecom-widget" style={{ height: 500, ...(deliveryType !== DeliveryTypeEnum.RUSSIAN_POST ? { display: 'none' } : {}) }} />
          <div id="cdek-map" style={{ height: 500, ...(deliveryType !== DeliveryTypeEnum.CDEK ? { display: 'none' } : {}) }} />
        </>
      </Modal>

      <h1 className={styles.title}>{t('title', { count: countCart })}</h1>

      <Form
        name="cart"
        className={styles.layout}
        onFinish={onFinish}
        form={form}
        initialValues={{ ...user, comment: '', deliveryDateTime: undefined, telegramNickname: '', personalDataConsent: false }}
      >
        {/* ── "Выбрать всё" — spans both columns (grid-area: header) ── */}
        <div className={styles.selectAllRow}>
          <Checkbox indeterminate={indeterminate} onChange={onCheckAllChange} checked={isFull}>
            {t('checkAll')}
          </Checkbox>
          {cartList.length > 0 && (
            <span className={styles.selectAllCount}>
              {cartList.length} / {filteredCart.length}
            </span>
          )}
        </div>

        {/* ── Items column ─────────────────────────────── */}
        <div className={styles.itemsCol}>
          <Checkbox.Group value={cartList} onChange={setCartList as any}>
            {cart.length === 0 && (
              <div className={styles.empty}>
                <NotFoundContent text={t('notFoundContent')} />
              </div>
            )}
            {cart.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                lang={lang}
                width={width}
                height={height}
                setCartList={setCartList}
              />
            ))}
          </Checkbox.Group>
        </div>

        {/* ── Summary panel ────────────────────────────── */}
        <div className={styles.summary}>
          <div className={styles.summaryTitle}>{t('deliveryType')}</div>

          {/* Delivery type options */}
          <div className={styles.deliverySection}>
            <div className={styles.deliveryOptions}>
              {deliveryList.map(({ label, value }) => (
                <div
                  key={value}
                  className={cn(styles.deliveryOption, {
                    [styles.selected]: deliveryType === value,
                    [styles.disabled]: !cartList.length,
                  })}
                  onClick={() => cartList.length && onDeliveryTypeChange(value)}
                >
                  <div className={styles.deliveryRadio} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* PVZ selector / reset */}
          {deliveryType && deliveryType !== DeliveryTypeEnum.PICKUP && (
            delivery.address
              ? <button className={styles.pvzBtn} type="button" onClick={resetPVZ}>{t('resetPVZ')}</button>
              : <button className={styles.pvzBtn} type="button" onClick={() => setIsOpenDeliveryWidget(true)}>{t('selectPVZ')}</button>
          )}

          {/* Selected PVZ info */}
          {delivery.address && deliveryType !== DeliveryTypeEnum.PICKUP && (
            <div className={styles.pvzInfo}>
              <strong>{t(delivery.cdekType === 'door' ? 'selectedPVZ.cdekDoorTitle' : 'selectedPVZ.title')}</strong>
              {t('selectedPVZ.address', { address: delivery.address })}
            </div>
          )}

          {/* Pickup: date/time + telegram */}
          {deliveryType === DeliveryTypeEnum.PICKUP && delivery.address && (
            <div className={styles.pickupFields}>
              <p className={styles.pickupNote}>{t('pickupDescription')}</p>
              <Form.Item
                name={['delivery', 'deliveryDateTime']}
                label={t('deliveryDateTime')}
                rules={[newOrderPositionValidation]}
                required
                layout="vertical"
                style={{ marginBottom: 12 }}
              >
                <MomentDatePicker
                  size="middle"
                  showTime
                  format={DateFormatEnum.DD_MM_YYYY_HH_MM}
                  showNow={false}
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < moment().startOf('day')}
                  disabledTime={() => ({ disabledHours: () => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 21, 22, 23], disabledMinutes: () => [], disabledSeconds: () => [] })}
                  locale={lang === UserLangEnum.RU ? locale : undefined}
                  styles={{ popup: isMobile ? { root: { maxHeight: '80vh', overflow: 'auto', maxWidth: 'min(375px, calc(100vw - 30px))' } } : undefined }}
                />
              </Form.Item>
              <Form.Item name="telegramNickname" label={t('telegramUsername')} layout="vertical" style={{ marginBottom: 8 }}>
                <Input size="middle" prefix={<Telegram style={{ color: '#0088cc' }} />} placeholder={t('telegramPlaceholder')} />
              </Form.Item>
            </div>
          )}

          {/* Guest user fields */}
          {!name && (
            <>
              <Form.Item<UserSignupInterface> name="name" rules={[signupValidation]} style={{ marginBottom: 12 }}>
                <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} disabled={!!user?.name} />
              </Form.Item>
              <Form.Item<UserSignupInterface> name="phone" rules={[signupValidation]} style={{ marginBottom: 12 }}>
                <MaskedInput size="large" mask="+7 (000) 000-00-00" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} disabled={!!user?.phone} />
              </Form.Item>
            </>
          )}

          {/* Comment */}
          <Form.Item<CreateOrderInterface['comment']> name="comment" rules={[newOrderPositionValidation]} style={{ marginBottom: 16 }}>
            <Input.TextArea rows={3} placeholder={t('comment')} />
          </Form.Item>

          <hr className={styles.sep} />

          {/* Totals */}
          <div className={styles.totalsRow}>
            <span>{t('itemCount', { count })}</span>
            <span>{tPrice('price', { price })}</span>
          </div>
          <div className={styles.totalsRow}>
            <span>{t('delivery')}</span>
            <span>{isDeliveryFree ? t('free') : tPrice('price', { price: delivery.price })}</span>
          </div>

          {/* Promo */}
          <div className={styles.promoRow}>
            <span className={styles.promoLabel}>{t('promotional')}</span>
            {promotional
              ? (
                <div className={styles.promoTag}>
                  <Tag
                    color="success"
                    variant="outlined"
                    closeIcon={<CloseOutlined style={{ fontSize: 10 }} />}
                    onClose={() => setPromotional(undefined)}
                    style={{ margin: 0 }}
                  >
                    {t('promotionalName', { name: promotional.name })}
                  </Tag>
                  <span className={styles.promoDiscount}>
                    {t('promotionalDiscount', {
                      discount: promotional.freeDelivery && promotional.buyTwoGetOne
                        ? savedDeliveryPrice + getOrderDiscount(getPreparedOrder(positions, delivery.price, promotional))
                        : promotional.freeDelivery
                          ? savedDeliveryPrice
                          : getOrderDiscount(getPreparedOrder(positions, delivery.price, promotional)),
                    })}
                  </span>
                </div>
              )
              : (
                <Form.Item name="promotional" style={{ marginBottom: 0, flex: 1, maxWidth: 160 }}>
                  <Input
                    size="middle"
                    placeholder={t('promotional')}
                    disabled={!filteredCart.length || !delivery.address || (deliveryType === DeliveryTypeEnum.PICKUP && !deliveryDateTimeValue)}
                  />
                </Form.Item>
              )}
          </div>

          <hr className={styles.sep} />

          {/* Total */}
          <div className={styles.totalsMain}>
            <span>{t('total')}</span>
            <span>{tPrice('price', { price: totalPrice })}</span>
          </div>

          {/* Consent */}
          <Form.Item
            name="personalDataConsent"
            valuePropName="checked"
            rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error(tValidation('personalDataConsentRequired')))) }]}
            style={{ marginBottom: 12 }}
          >
            <Checkbox>
              <span className={styles.consent}>
                {t('personalDataConsent')}
                <Link href={routes.page.base.privacyPolicy} title={t('policy')}> {t('policy')}</Link>
              </span>
            </Checkbox>
          </Form.Item>

          {/* Submit */}
          {selectPromotionField
            ? (
              <button
                className={styles.btnSubmit}
                type="button"
                disabled={isSubmitDisabled}
                onClick={onPromotional}
              >
                {t('acceptPromotional')}
              </button>
            )
            : (
              <button
                className={styles.btnSubmit}
                type="submit"
                disabled={isSubmitDisabled}
              >
                {t(!name && !user.phone ? 'confirmPhone' : 'submitPay')}
              </button>
            )}
        </div>
      </Form>
    </div>
  );
};
