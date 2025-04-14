import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { Alert, Badge, Button, Card, Tag, Tooltip } from 'antd';
import { useContext, useEffect, useState } from 'react';
import moment from 'moment';
import Image from 'next/image';
import { StopOutlined, ForwardOutlined, BackwardOutlined } from '@ant-design/icons';
import Link from 'next/link';
import cn from 'classnames';
import axios from 'axios';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { type OrderResponseInterface, selectors, updateOrder, cancelOrder } from '@/slices/orderSlice';
import { routes } from '@/routes';
import { truncateText } from '@/utilities/truncateText';
import { getOrderDiscount, getOrderPrice } from '@/utilities/order/getOrderPrice';
import { getWidth } from '@/utilities/screenExtension';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { MobileContext, SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import { OrderStatusFilter } from '@/components/filters/order/OrderStatusFilter';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { OrderInterface } from '@/types/order/Order';

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

  const { role } = useAppSelector((state) => state.user);

  const isAdmin = role === UserRoleEnum.ADMIN;

  const stateOrders = useAppSelector(selectors.selectAll);

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
    const { payload } = await dispatch(updateOrder({ id: orderId, data: { status } })) as { payload: OrderResponseInterface };
    if (payload.code === 1) {
      handleUpdate(payload);
      toast(tToast('changeOrderStatusSuccess', { id: payload.order.id, status: t(`statuses.${payload.order.status}`) }), 'success');
    }
    setIsSubmit(false);
  };

  const cancelOrderHandler = async (orderId: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(cancelOrder(orderId)) as { payload: OrderResponseInterface };
    if (payload.code === 1) {
      handleUpdate(payload);
      toast(tToast('cancelOrderStatusSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  const getActions = (status: OrderStatusEnum, orderId: number) => {
    const { back, next } = getNextOrderStatuses(status);

    return isAdmin
      ? [
        ...(status === OrderStatusEnum.CANCELED ? [] : [<StopOutlined key="stop" onClick={() => cancelOrderHandler(orderId)} title={t('actions.stop')} />]),
        ...(back ? [<BackwardOutlined key="back" onClick={() => changeStatusHandler(back, orderId)} className="fs-5" title={t('actions.change', { status: t(`statuses.${back}`) })} />] : []),
        ...(next ? [<ForwardOutlined key="next" onClick={() => changeStatusHandler(next, orderId)} className="fs-5" title={t('actions.change', { status: t(`statuses.${next}`) })} />] : []),
      ]
      : status === OrderStatusEnum.NOT_PAID ? [<StopOutlined key="stop" onClick={() => cancelOrderHandler(orderId)} title={t('actions.stop')} />] : [];
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
      <div className={cn('d-flex flex-column gap-4 w-100', { 'ms-xl-3': !setData })}>
        {!setData && <OrderStatusFilter statuses={statuses} setStatuses={setStatuses} />}
        {orders.sort((a, b) => b.id - a.id).filter((order) => !statuses.length || statuses.includes(order.status)).map((order) => (
          <Badge.Ribbon key={order.id} text={t(`statuses.${order.status}`)} color={getOrderStatusColor(order.status)}>
            <Card
              actions={getActions(order.status, order.id)}
            >
              <div className="d-flex flex-column flex-xl-row col-12 gap-3 gap-xl-0">
                <Link href={`${setData ? routes.allOrders : routes.orderHistory}/${order.id}`} className="d-flex flex-column justify-content-between col-12 gap-3 gap-xl-0 col-xl-4">
                  <div className="d-flex flex-column" style={{ minHeight: 100 }}>
                    <span className="fs-6 mb-3">{t('orderNumber', { id: order.id })}</span>
                    <span className="text-muted">{moment(order.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                  </div>
                  <div className="d-flex flex-column gap-2">
                    {order.promotional
                      ? <Tag color="#e3dcfa" className={cn('fs-6 text-wrap', { 'w-100': isMobile })} style={{ padding: '5px 10px', color: '#69788e', ...(isMobile ? {} : { width: 'max-content' }) }}>
                        <span>{t('promotional')}</span>
                        <span className="fw-bold">{t('promotionalDiscount', { name: order.promotional.name, discount: getOrderDiscount(order) })}</span>
                      </Tag>
                      : null}
                    <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                      <span>{t('delivery')}</span>
                      <span className="fw-bold">{t('price', { price: order.deliveryPrice })}</span>
                    </Tag>
                    {order.status === OrderStatusEnum.NOT_PAID
                      ? isAdmin ? (
                        <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                          <span>{t('notPayment', { price: getOrderPrice(order) })}</span>
                        </Tag>
                      ) : <Button className="button" style={isMobile ? {} : { width: 'max-content' }} onClick={() => onPay(order.id)}>{t('pay', { price: getOrderPrice(order) })}</Button>
                      : (
                        <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                          <span>{t('payment')}</span>
                          <span className="fw-bold">{t('price', { price: getOrderPrice(order) })}</span>
                        </Tag>)}
                    {order.comment
                      ? <span className="mt-2">{order.comment}</span>
                      : null}
                  </div>
                </Link>
                <div className="d-flex flex-column col-12 col-xl-8 gap-2">
                  {order.positions.map((position) =>
                    <Tooltip key={position.id} title={isMobile ? '' : position.item.name} className="d-flex align-items-center justify-content-between justify-content-xl-start gap-xl-3" placement="left" color="#4d689e">
                      <Link href={getHref(position.item)} className="col-5 col-xl-2 font-oswald lh-1 me-2">{truncateText(position.item.name)}</Link>
                      <div className="d-flex col-xl-10 gap-2">{position.item.images.map((image, index) =>
                        index < maxPhoto
                          ? <Image key={image.id} src={image.src} width={width} height={height} unoptimized alt={position.item.name} style={{ borderRadius: '5px' }} />
                          : index === maxPhoto
                            ? <div key={image.id} className="d-flex align-items-center fs-6">
                              <span style={{ backgroundColor: '#eaeef6', borderRadius: '10px', padding: '6px 10px' }}>{`+${position.item.images.length - maxPhoto}`}</span>
                            </div>
                            : null)}
                      </div>
                    </Tooltip>)}
                </div>
              </div>
            </Card>
          </Badge.Ribbon>
        ))}
      </div>
    )
    : <Alert message={t('notFound')} type="success" style={{ height: '3rem' }} />;
};
