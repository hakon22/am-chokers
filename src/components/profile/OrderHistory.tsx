import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Tag, Tooltip } from 'antd';
import { useContext, useEffect, useEffectEvent, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import { StopOutlined, ForwardOutlined, BackwardOutlined, CopyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import cn from 'classnames';
import axios from 'axios';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { type OrderResponseInterface, selectors, updateOrder, cancelOrder } from '@/slices/orderSlice';
import { replaceCart } from '@/slices/cartSlice';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { getWidth } from '@/utilities/screenExtension';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { MobileContext, SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { OrderStatusFilter } from '@/components/filters/order/OrderStatusFilter';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { OrderInterface } from '@/types/order/Order';
import type { CartItemInterface } from '@/types/cart/Cart';

interface OrderHistoryInterface {
  data?: OrderInterface[];
  setData?: React.Dispatch<React.SetStateAction<OrderInterface[]>>;
}

export const OrderHistory = ({ data, setData }: OrderHistoryInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();

  const urlParams = useSearchParams();
  
  const statusesParams = urlParams.getAll('statuses') as OrderStatusEnum[];

  const dispatch = useAppDispatch();

  const coefficient = 1.3;

  const width = 77;
  const height = width * coefficient;

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [maxPosition, setMaxPosition] = useState(3);
  const [statuses, setStatuses] = useState<OrderStatusEnum[]>(statusesParams);
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [isAnimating, setIsAnimating] = useState<number>();

  const { id: userId, isAdmin, lang } = useAppSelector((state) => state.user);

  const stateOrders = useAppSelector(selectors.selectAll);

  const setOrdersEffect = useEffectEvent(setOrders);

  const handlePhoneCopy = (order: OrderInterface) => {
    setIsAnimating(order.id);
    navigator.clipboard.writeText(order.user.phone);
    setTimeout(() => setIsAnimating(undefined), 1000);
  };

  const handleUpdate = (result: OrderResponseInterface) => {
    if (data?.length && setData) {
      setData((state) => {
        const index = state.findIndex((stateOrder) => stateOrder.id === result.order.id);
        if (index !== -1) {
          state[index] = result.order;
        }
        return state;
      });
    }
  };

  const changeStatusHandler = async (status: OrderStatusEnum, orderId: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(updateOrder({ id: orderId, data: { status } })) as { payload: OrderResponseInterface; };
    if (payload.code === 1) {
      handleUpdate(payload);
      toast(tToast('changeOrderStatusSuccess', { id: payload.order.id, status: t(`statuses.${payload.order.status}`) }), 'success');
    }
    setIsSubmit(false);
  };

  const cancelOrderHandler = async (orderId: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(cancelOrder(orderId)) as { payload: OrderResponseInterface & { cart: CartItemInterface[]; }; };
    if (payload.code === 1) {
      handleUpdate(payload);
      if (userId === payload.order.user.id) {
        dispatch(replaceCart(payload.cart));
      }
      toast(tToast('cancelOrderStatusSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  const getActions = (order: OrderInterface, orderId: number) => {
    const { back, next } = getNextOrderStatuses(order.status);

    return isAdmin
      ? [
        ...(order.status === OrderStatusEnum.CANCELED ? [] : [
          <div key="stop" title={t('actions.stop')} onClick={() => cancelOrderHandler(orderId)}>
            <span className="me-2">{t('actions.stop')}</span>
            <StopOutlined />
          </div>,
        ]),
        ...(back ? [<BackwardOutlined key="back" onClick={() => changeStatusHandler(back, orderId)} className="fs-5" title={t('actions.change', { status: t(`statuses.${back}`) })} />] : []),
        ...(next ? [<ForwardOutlined key="next" onClick={() => changeStatusHandler(next, orderId)} className="fs-5" title={t('actions.change', { status: t(`statuses.${next}`) })} />] : []),
      ]
      : !order.isPayment ? [
        <div key="stop" title={t('actions.stop')} onClick={() => cancelOrderHandler(orderId)}>
          <span className="me-2">{t('actions.stop')}</span>
          <StopOutlined />
        </div>,
      ] : [];
  };

  const onPay = async (id: number) => {
    try {
      setIsSubmit(true);
      const response = await axios.get<{ code: number; url: string; }>(routes.order.pay(id));
      if (response.data.code === 1) {
        router.push(response.data.url);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (stateOrders.length || data?.length) {
      setOrdersEffect(isAdmin && data ? data : stateOrders);
    }
  }, [stateOrders, data]);

  useEffect(() => {
    const handleResize = () => {
      const extension = getWidth();
      
      if (isMobile) {
        setMaxPosition(3);
      } else if (extension < 1400) {
        setMaxPosition(4);
      } else {
        setMaxPosition(5);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return orders.length
    ? (
      <div className={cn('d-flex flex-column gap-4 w-100 without-padding', { 'ms-xl-3': !setData })}>
        {!setData && <OrderStatusFilter statuses={statuses} setStatuses={setStatuses} lang={lang as UserLangEnum} />}
        {orders.sort((a, b) => b.id - a.id).filter((order) => !statuses.length || statuses.includes(order.status)).map((order) => (
          <Badge.Ribbon key={order.id} text={t(`statuses.${order.status}`)} color={getOrderStatusColor(order.status)}>
            <Card
              actions={getActions(order, order.id)}
            >
              <div className="d-flex flex-column flex-xl-row justify-content-xl-between align-items-xl-center mb-2 mb-xl-4 gap-2">
                <Link href={`${setData ? routes.page.admin.allOrders : routes.page.profile.orderHistory}/${order.id}`} className="fs-5 fw-bold font-oswald text-decoration-underline text-primary text-muted fw-light text-center text-xl-start">
                  {t('orderDate', { number: order.id, date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}
                </Link>
                {!order.isPayment
                  ? isAdmin && order.user.id !== userId ? (
                    <Tag color="#eaeef6" variant="outlined" className="fs-6 text-wrap" style={{ padding: '5px 10px', color: '#69788e' }}>
                      <span>{t('notPayment', { price: getOrderPrice(order) })}</span>
                    </Tag>
                  ) : order.status !== OrderStatusEnum.CANCELED ? <Button className="button" onClick={() => onPay(order.id)}>{t('pay', { price: getOrderPrice(order) })}</Button> : null
                  : (
                    <Tag color="#eaeef6" variant="outlined" className="fs-6 text-wrap text-center text-xl-start" style={{ padding: '5px 10px', color: '#69788e' }}>
                      <span>{t('payment')}</span>
                      <span className="fw-bold">{t('price', { price: getOrderPrice(order) })}</span>
                    </Tag>)}
              </div>
              {isAdmin && (
                <div className={cn('d-flex flex-xl-row gap-2 mb-3 mb-xl-0 mt-3 mt-xl-0', { 'position-absolute top-0': !isMobile })}>
                  <Link href={`${routes.page.admin.userCard}/${order.user.id}`} className="fs-5">{order.user.name}</Link>
                  <Button type="dashed" style={{ color: 'orange' }} className={cn('d-flex align-items-center fs-5', { 'animate__animated animate__headShake': isAnimating === order.id })} onClick={() => handlePhoneCopy(order)}>
                    <CopyOutlined className="fs-5" />{order.user.phone}
                  </Button>
                </div>
              )}
              <div className="d-flex flex-column flex-xl-row col-12 gap-3 gap-xl-0">
                <div className="d-flex flex-column gap-2 col-12 col-xl-4">
                  <div>
                    <Tag color="#eaeef6" variant="outlined" className="fs-6 text-wrap" style={{ padding: '5px 10px', color: '#69788e' }}>
                      <span className="fw-bold">{getDeliveryTypeTranslate(order.delivery.type, lang as UserLangEnum)}</span>
                    </Tag>
                  </div>
                  {!setData && !order.positions.some((position) => position.grade) && order.status === OrderStatusEnum.COMPLETED &&
                    <div>
                      <Button className="button mt-2 fs-5" onClick={() => router.push(`${setData ? routes.page.admin.allOrders : routes.page.profile.orderHistory}/${order.id}`)}>
                        {t('rateYourOrder')}
                      </Button>
                    </div>
                  }
                </div>
                <div className="d-flex flex-xl-row justify-content-xl-end gap-1 gap-xl-2 col-12 col-xl-8">
                  {order.positions.map((position, index) => index < maxPosition
                    ? (
                      <div key={position.id} className="d-flex">
                        <Tooltip title={isMobile ? '' : position.item.translations.find((translation) => translation.lang === lang)?.name} className="d-flex align-items-center justify-content-between justify-content-xl-start gap-xl-3" placement="left" color="#4d689e">
                          <Link href={getHref(position.item)}>{
                            position.item.images[0].src.endsWith('.mp4')
                              ? <video src={position.item.images[0].src} width={width} height={height} style={{ borderRadius: '5px' }} autoPlay loop muted playsInline />
                              : <Image src={position.item.images[0].src} width={width} height={height} alt={position.item.translations.find((translation) => translation.lang === lang)?.name as string} style={{ borderRadius: '5px' }} />}
                          </Link>
                        </Tooltip>
                      </div>
                    ) : index === maxPosition
                      ? (
                        <div key={position.id} className="d-flex align-items-center fs-6">
                          <span style={{ backgroundColor: '#eaeef6', borderRadius: '10px', padding: '6px 10px' }}>{`+${order.positions.length - maxPosition}`}</span>
                        </div>
                      )
                      : null,
                  )}
                </div>
              </div>
              <div className="d-flex justify-content-between fs-6 text-muted fw-bold mt-4 mt-xl-0">
                <span>{t('totalAmount', { price: getOrderPrice(order) } )}</span>
              </div>
            </Card>
          </Badge.Ribbon>
        ))}
      </div>
    )
    : <Alert title={t('notFound')} type="success" style={{ height: '3rem' }} />;
};
