import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useRouter } from 'next/navigation';
import { Popconfirm, Tooltip } from 'antd';
import {
  StopOutlined, ForwardOutlined, BackwardOutlined,
  CopyOutlined, ContainerOutlined, ShoppingOutlined,
} from '@ant-design/icons';
import Image from 'next/image';
import Link from 'next/link';
import moment from 'moment';
import axios from 'axios';
import cn from 'classnames';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { type OrderResponseInterface, selectors, updateOrder, cancelOrder } from '@/slices/orderSlice';
import { replaceCart } from '@/slices/cartSlice';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { MobileContext, SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { V2OrderStatusFilter } from '@/themes/v2/components/profile/V2OrderStatusFilter';
import { getHref } from '@/utilities/getHref';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { PreviewImage } from '@/components/PreviewImage';
import { urlToBase64, getBase64 } from '@/components/UploadImage';
import { getWidth } from '@/utilities/screenExtension';
import styles from '@/themes/v2/components/profile/V2OrderHistory.module.scss';
import type { OrderInterface } from '@/types/order/Order';
import type { CartItemInterface } from '@/types/cart/Cart';

const isVideo = (src: string) => src.endsWith('.mp4');

interface Props {
  data?: OrderInterface[];
  setData?: React.Dispatch<React.SetStateAction<OrderInterface[]>>;
}

export const V2OrderHistory = ({ data, setData }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const router = useRouter();
  const urlParams = useSearchParams();
  const statusesParams = urlParams.getAll('statuses') as OrderStatusEnum[];

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const { id: userId, isAdmin, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const stateOrders = useAppSelector(selectors.selectAll);

  const [maxPosition, setMaxPosition] = useState(4);
  const [statuses, setStatuses] = useState<OrderStatusEnum[]>(statusesParams);
  const [orders, setOrders] = useState<OrderInterface[]>([]);
  const [isAnimating, setIsAnimating] = useState<number>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const setOrdersEffect = useEffectEvent(setOrders);

  const handlePhoneCopy = (order: OrderInterface) => {
    setIsAnimating(order.id);
    navigator.clipboard.writeText(order.user.phone);
    setTimeout(() => setIsAnimating(undefined), 1000);
  };

  const handleUpdate = (result: OrderResponseInterface) => {
    if (data?.length && setData) {
      setData((prev) => {
        const next = [...prev];
        const idx = next.findIndex((o) => o.id === result.order.id);
        if (idx !== -1) next[idx] = result.order;
        return next;
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
    const { payload } = await dispatch(cancelOrder(orderId)) as { payload: OrderResponseInterface & { cart: CartItemInterface[] } };
    if (payload.code === 1) {
      handleUpdate(payload);
      if (userId === payload.order.user.id) dispatch(replaceCart(payload.cart));
      toast(tToast('cancelOrderStatusSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  const onPay = async (id: number) => {
    try {
      setIsSubmit(true);
      const response = await axios.get<{ code: number; url: string }>(routes.order.pay(id));
      if (response.data.code === 1) router.push(response.data.url);
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
      const w = getWidth();
      setMaxPosition(isMobile ? 3 : w < 1400 ? 4 : 5);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile]);

  if (!orders.length) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <ShoppingOutlined />
          <span>{t('notFound')}</span>
        </div>
      </div>
    );
  }

  const baseRoute = setData ? routes.page.admin.allOrders : routes.page.profile.orderHistory;

  const visibleOrders = orders
    .slice()
    .sort((a, b) => b.id - a.id)
    .filter((o) => !statuses.length || statuses.includes(o.status));

  return (
    <div className={styles.wrap}>
      <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />

      {!setData && (
        <V2OrderStatusFilter statuses={statuses} setStatuses={setStatuses} lang={lang as UserLangEnum} />
      )}

      {visibleOrders.map((order) => {
        const { back, next } = getNextOrderStatuses(order.status);
        const isCanceled = order.status === OrderStatusEnum.CANCELED;

        return (
          <div key={order.id} className={styles.card}>
            {/* ── Header ── */}
            <div className={styles.cardHeader}>
              <div className={styles.cardMeta}>
                <Link href={`${baseRoute}/${order.id}`} className={styles.cardId}>
                  {t('orderDate', { number: order.id, date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}
                </Link>
                <span className={styles.deliveryChip}>
                  {getDeliveryTypeTranslate(order.delivery.type, lang as UserLangEnum)}
                </span>
              </div>
              <span className={styles.statusBadge} style={{ background: getOrderStatusColor(order.status) }}>
                {t(`statuses.${order.status}`)}
              </span>
            </div>

            {/* ── Admin user info ── */}
            {isAdmin && (
              <div className={styles.adminMeta}>
                <Link href={`${routes.page.admin.userCard}/${order.user.id}`} className={styles.adminLink}>
                  {order.user.name}
                </Link>
                <button
                  type="button"
                  className={cn(styles.phoneCopyBtn, { 'animate__animated animate__headShake': isAnimating === order.id })}
                  onClick={() => handlePhoneCopy(order)}
                >
                  <CopyOutlined /> {order.user.phone}
                </button>
                {order.user.telegramUsername && (
                  <a
                    href={`https://t.me/${order.user.telegramUsername}`}
                    className={cn(styles.phoneCopyBtn, styles.telegramLink)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    @{order.user.telegramUsername}
                  </a>
                )}
              </div>
            )}

            {/* ── Thumbnails ── */}
            <div className={styles.cardBody}>
              <div className={styles.thumbs}>
                {order.positions.map((position, index) => {
                  if (index > maxPosition) return null;
                  if (index === maxPosition) return (
                    <div key={position.id} className={styles.thumbMore}>
                      +{order.positions.length - maxPosition}
                    </div>
                  );
                  const src = position.item.images[0]?.src ?? '';
                  return (
                    <Tooltip key={position.id} title={isMobile ? '' : position.item.translations.find((translation) => translation.lang === lang)?.name} placement="top" color="#4d689e">
                      <Link href={getHref(position.item)} className={styles.thumb}>
                        {src && (isVideo(src)
                          ? <video src={src} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Image src={src} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
                        )}
                      </Link>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className={styles.cardFooter}>
              <div className={styles.cardFooterLeft}>
                <span className={styles.totalAmount}>{t('totalAmount', { price: getOrderPrice(order) })}</span>
                {order.receiptUrl && (
                  <ContainerOutlined
                    className={styles.receiptIcon}
                    title={t('receipt')}
                    onClick={() => urlToBase64({ url: order.receiptUrl, setPreviewImage, setPreviewOpen, getBase64, setIsSubmit, withoutAuth: true })}
                  />
                )}
              </div>

              <div className={styles.actions}>
                {/* Payment */}
                {order.isPayment ? (
                  <span className={styles.tagPaid}>{t('payment')}{tPrice('price', { price: getOrderPrice(order) })}</span>
                ) : (
                  !isCanceled && (
                    isAdmin && order.user.id !== userId
                      ? <span className={styles.tagNotPaid}>{t('notPayment', { price: getOrderPrice(order) })}</span>
                      : (
                        <button className={styles.btnPay} type="button" onClick={() => onPay(order.id)}>
                          {t('pay', { price: getOrderPrice(order) })}
                        </button>
                      )
                  )
                )}

                {/* Rate order */}
                {!setData && !order.positions.some((position) => position.grade) && order.status === OrderStatusEnum.COMPLETED && (
                  <button className={styles.btnRate} type="button" onClick={() => router.push(`${baseRoute}/${order.id}`)}>
                    {t('rateYourOrder')}
                  </button>
                )}

                {/* Admin: cancel + status change */}
                {isAdmin && !isCanceled && (
                  <Popconfirm title={t('actions.cancelConfirm')} okText={t('actions.okText')} cancelText={t('actions.cancel')} onConfirm={() => cancelOrderHandler(order.id)}>
                    <button className={styles.btnCancel} type="button">
                      <StopOutlined /> {t('actions.stop')}
                    </button>
                  </Popconfirm>
                )}
                {isAdmin && back && (
                  <button className={styles.btnStatus} type="button" title={t('actions.change', { status: t(`statuses.${back}`) })} onClick={() => changeStatusHandler(back, order.id)}>
                    <BackwardOutlined />
                  </button>
                )}
                {isAdmin && next && (
                  <button className={styles.btnStatus} type="button" title={t('actions.change', { status: t(`statuses.${next}`) })} onClick={() => changeStatusHandler(next, order.id)}>
                    <ForwardOutlined />
                  </button>
                )}

                {/* User: cancel unpaid */}
                {!isAdmin && !order.isPayment && !isCanceled && (
                  <Popconfirm title={t('actions.cancelConfirm')} okText={t('actions.okText')} cancelText={t('actions.cancel')} onConfirm={() => cancelOrderHandler(order.id)}>
                    <button className={styles.btnCancel} type="button">
                      <StopOutlined /> {t('actions.stop')}
                    </button>
                  </Popconfirm>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
