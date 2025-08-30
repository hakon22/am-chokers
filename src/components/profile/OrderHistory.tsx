import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Tag, Tooltip } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import Image from 'next/image';
import { StopOutlined, ForwardOutlined, BackwardOutlined, ArrowRightOutlined, HeartTwoTone, CopyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import cn from 'classnames';
import axios from 'axios';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { type OrderResponseInterface, selectors, updateOrder, cancelOrder } from '@/slices/orderSlice';
import { replaceCart } from '@/slices/cartSlice';
import { routes } from '@/routes';
import { truncateText } from '@/utilities/truncateText';
import { getOrderDiscount, getOrderPrice } from '@/utilities/order/getOrderPrice';
import { getWidth } from '@/utilities/screenExtension';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { MobileContext, SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import { getDeliveryStatusTranslate } from '@/utilities/order/getDeliveryStatusTranslate';
import { OrderStatusFilter } from '@/components/filters/order/OrderStatusFilter';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import image404 from '@/images/404.svg';
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

  const [maxPhoto, setMaxPhoto] = useState(3);
  const [statuses, setStatuses] = useState<OrderStatusEnum[]>(statusesParams);
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  const { id: userId, isAdmin, lang } = useAppSelector((state) => state.user);

  const stateOrders = useAppSelector(selectors.selectAll);

  const handlePhoneCopy = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1000);
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
      const response = await axios.get<{ code: number; url: string; }>(routes.payOrder(id));
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
      setOrders(isAdmin && data ? data : stateOrders);
    }
  }, [stateOrders, data]);

  useEffect(() => {
    const handleResize = () => {
      const extension = getWidth();
      
      if (isMobile) {
        setMaxPhoto(1);
      } else if (extension < 1400) {
        setMaxPhoto(2);
      } else {
        setMaxPhoto(3);
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
              <div className="d-flex flex-column flex-xl-row col-12 gap-3 gap-xl-0">
                <div className="d-flex flex-column justify-content-between col-12 gap-3 gap-xl-0 col-xl-4">
                  <div className="d-flex flex-column mb-xl-2" style={{ minHeight: 100, ...(isMobile ? {} : { width: '90%' }) }}>
                    {isAdmin && (
                      <div className="d-flex flex-column gap-2 mb-3">
                        <Link href={`${routes.userCard}/${order.user.id}`} className="fs-5">{order.user.name}</Link>
                        <CopyToClipboard text={order.user.phone}>
                          <Button type="dashed" style={{ color: 'orange' }} className={cn('d-flex align-items-center fs-5 col-12 col-xl-6', { 'animate__animated animate__headShake': isAnimating })} onClick={handlePhoneCopy}>
                            <CopyOutlined className="fs-5" />{order.user.phone}
                          </Button>
                        </CopyToClipboard>
                      </div>
                    )}
                    {!setData && !order.positions.some((position) => position.grade) && order.status === OrderStatusEnum.COMPLETED &&
                      <Link href={`${setData ? routes.allOrders : routes.orderHistory}/${order.id}`} className="mb-3">
                        <Tag color="orange" className="fs-6 text-decoration-underline text-wrap w-100" style={{ padding: '5px 10px' }}>
                          <span>{t('rateYourOrder')}</span>
                          <HeartTwoTone twoToneColor="#eb2f96" />
                        </Tag>
                      </Link>
                    }
                    <Link href={`${setData ? routes.allOrders : routes.orderHistory}/${order.id}`} className="fs-6 mb-3 text-primary text-muted fw-light text-center text-xl-start">
                      <ArrowRightOutlined className="me-2" />
                      <span className="fs-5 fw-bold font-oswald text-decoration-underline">{t('orderNumber', { id: order.id })}</span>
                    </Link>
                    <span className="text-muted">{moment(order.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                  </div>
                  <div className="d-flex flex-column gap-2" style={isMobile ? {} : { width: '90%' }}>
                    {order.promotional
                      ? <Tag color="#e3dcfa" className="fs-6 text-wrap w-100" style={{ padding: '5px 10px', color: '#69788e' }}>
                        <span>{t('promotional')}</span>
                        <span className="fw-bold">{t(order.promotional.freeDelivery ? 'promotionalName' : 'promotionalDiscount', { name: order.promotional.name, discount: getOrderDiscount(order) })}</span>
                      </Tag>
                      : null}
                    <Tag color="#eaeef6" className="fs-6 text-wrap w-100" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                      <span className="fw-bold">{`${getDeliveryStatusTranslate(order.delivery.type, lang as UserLangEnum)}: `}</span>
                      <span>{order.delivery.address}</span>
                    </Tag>
                    {!order.isPayment
                      ? isAdmin && order.user.id !== userId ? (
                        <Tag color="#eaeef6" className="fs-6 text-wrap w-100" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                          <span>{t('notPayment', { price: getOrderPrice(order) })}</span>
                        </Tag>
                      ) : order.status !== OrderStatusEnum.CANCELED ? <Button className="button" style={isMobile ? {} : { width: 'max-content' }} onClick={() => onPay(order.id)}>{t('pay', { price: getOrderPrice(order) })}</Button> : null
                      : (
                        <Tag color="#eaeef6" className="fs-6 text-wrap w-100" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                          <span>{t('payment')}</span>
                          <span className="fw-bold">{t('price', { price: getOrderPrice(order) })}</span>
                        </Tag>)}
                    {order.comment
                      ? <span className="mt-2">{order.comment}</span>
                      : null}
                  </div>
                </div>
                <div className="d-flex flex-column justify-content-between col-12 col-xl-8 gap-5">
                  <div className="d-flex flex-column gap-2">
                    {order.positions.map((position) =>
                      <Tooltip key={position.id} title={isMobile ? '' : position.item.translations.find((translation) => translation.lang === lang)?.name} className="d-flex align-items-center justify-content-between justify-content-xl-start gap-xl-3" placement="left" color="#4d689e">
                        <Link href={getHref(position.item)} className="col-5 col-xl-2 font-oswald lh-1 me-2">{truncateText(position.item.translations.find((translation) => translation.lang === lang)?.name as string)}</Link>
                        <div className="d-flex col-xl-10 gap-2">{position.item.images.map((image, index) =>
                          index < maxPhoto
                            ? image.src.endsWith('.mp4')
                              ? <video key={image.id} src={image.src} width={width} height={height} style={{ borderRadius: '5px' }} autoPlay loop muted playsInline />
                              : <Image key={image.id} src={image.src || image404} width={width} height={height} unoptimized alt={position.item.translations.find((translation) => translation.lang === lang)?.name as string} style={{ borderRadius: '5px' }} />
                            : index === maxPhoto
                              ? <div key={image.id} className="d-flex align-items-center fs-6">
                                <span style={{ backgroundColor: '#eaeef6', borderRadius: '10px', padding: '6px 10px' }}>{`+${position.item.images.length - maxPhoto}`}</span>
                              </div>
                              : null)}
                        </div>
                      </Tooltip>)}
                  </div>
                  <div className="d-flex fs-5 text-uppercase fw-bold">
                    <span>{t('totalAmount', { price: getOrderPrice(order) } )}</span>
                  </div>
                </div>
              </div>
            </Card>
          </Badge.Ribbon>
        ))}
      </div>
    )
    : <Alert message={t('notFound')} type="success" style={{ height: '3rem' }} />;
};
