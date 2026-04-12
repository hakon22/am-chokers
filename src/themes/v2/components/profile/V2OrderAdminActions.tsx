import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Popconfirm } from 'antd';
import { StopOutlined, ForwardOutlined, BackwardOutlined } from '@ant-design/icons';
import axios from 'axios';
import cn from 'classnames';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { type OrderResponseInterface, updateOrder, cancelOrder } from '@/slices/orderSlice';
import { replaceCart } from '@/slices/cartSlice';
import { routes } from '@/routes';
import { getOrderPrice } from '@/utilities/order/getOrderPrice';
import { getNextOrderStatuses } from '@/utilities/order/getNextOrderStatus';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { SubmitContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import type { OrderInterface } from '@/types/order/Order';
import type { CartItemInterface } from '@/types/cart/Cart';

import styles from './V2OrderAdminActions.module.scss';

export type V2OrderAdminActionsVariant = 'default' | 'listRow';

interface Props {
  /** Заказ, по которому доступны действия администратора */
  order: OrderInterface;
  /**
   * Вызывается после успешной отмены или смены статуса, чтобы родитель синхронизировал локальное состояние
   * @param updatedOrder - актуальные данные заказа с сервера
   */
  onOrderUpdated?: (updatedOrder: OrderInterface) => void;
  /** Дополнительный класс корневого узла */
  className?: string;
  /**
   * default — карточка с заголовком (страница заказа, профиль админа).
   * listRow — только кнопки в одну линию для футера списка заказов в админке.
   */
  variant?: V2OrderAdminActionsVariant;
}

/**
 * Панель управления заказом в админке: оплата своего неоплаченного заказа, отмена, переход по статусам.
 * Статус оплаты (чипы) показывается в шапке карточки или страницы заказа.
 */
export const V2OrderAdminActions = ({ order, onOrderUpdated, className, variant = 'default' }: Props) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);

  const { id: userId, isAdmin } = useAppSelector((state) => state.user);

  if (!isAdmin) {
    return null;
  }

  const isCanceled = order.status === OrderStatusEnum.CANCELED;
  const { back, next } = getNextOrderStatuses(order.status);

  /**
   * Пробрасывает обновлённый заказ родителю (список или страница заказа).
   * @param nextOrder - актуальные данные заказа с сервера
   */
  const syncOrder = (nextOrder: OrderInterface) => {
    onOrderUpdated?.(nextOrder);
  };

  /**
   * Меняет статус заказа по конвейеру статусов.
   * @param status - целевой статус
   * @param orderId - идентификатор заказа
   * @returns завершение запроса к API и обновление индикатора отправки формы
   */
  const changeStatusHandler = async (status: OrderStatusEnum, orderId: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(updateOrder({ id: orderId, data: { status } })) as { payload: OrderResponseInterface };
    if (payload.code === 1) {
      syncOrder(payload.order);
      toast(tToast('changeOrderStatusSuccess', { id: payload.order.id, status: t(`statuses.${payload.order.status}`) }), 'success');
    }
    setIsSubmit(false);
  };

  /**
   * Отменяет заказ от имени администратора.
   * @param orderId - идентификатор заказа
   * @returns завершение запроса к API и обновление индикатора отправки формы
   */
  const cancelOrderHandler = async (orderId: number) => {
    setIsSubmit(true);
    const { payload } = await dispatch(cancelOrder(orderId)) as { payload: OrderResponseInterface & { cart: CartItemInterface[] } };
    if (payload.code === 1) {
      syncOrder(payload.order);
      if (userId === payload.order.user.id) {
        dispatch(replaceCart(payload.cart));
      }
      toast(tToast('cancelOrderStatusSuccess'), 'success');
    }
    setIsSubmit(false);
  };

  /**
   * Перенаправляет на страницу оплаты ЮKassa.
   * @param id - идентификатор заказа
   * @returns завершение запроса за ссылкой на оплату или обработка ошибки
   */
  const onPay = async (id: number) => {
    try {
      setIsSubmit(true);
      const response = await axios.get<{ code: number; url: string }>(routes.order.pay(id));
      if (response.data.code === 1) {
        router.push(response.data.url);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  if (isCanceled) {
    return null;
  }

  const cancelOrderButton = (
    <Popconfirm
      title={t('actions.cancelConfirmAdmin', { number: order.id })}
      okText={t('actions.okText')}
      cancelText={t('actions.cancel')}
      onConfirm={() => cancelOrderHandler(order.id)}
    >
      <button className={styles.btnCancel} type="button">
        <StopOutlined /> {t('actions.stop')}
      </button>
    </Popconfirm>
  );

  const statusArrowButtons = (
    <>
      {back && (
        <Popconfirm
          title={t('actions.statusChangeConfirm', { number: order.id, status: t(`statuses.${back}`) })}
          okText={t('actions.okText')}
          cancelText={t('actions.cancel')}
          onConfirm={() => changeStatusHandler(back, order.id)}
        >
          <button className={styles.btnStatus} type="button" title={t('actions.change', { status: t(`statuses.${back}`) })}>
            <BackwardOutlined />
          </button>
        </Popconfirm>
      )}
      {next && (
        <Popconfirm
          title={t('actions.statusChangeConfirm', { number: order.id, status: t(`statuses.${next}`) })}
          okText={t('actions.okText')}
          cancelText={t('actions.cancel')}
          onConfirm={() => changeStatusHandler(next, order.id)}
        >
          <button className={styles.btnStatus} type="button" title={t('actions.change', { status: t(`statuses.${next}`) })}>
            <ForwardOutlined />
          </button>
        </Popconfirm>
      )}
    </>
  );

  if (variant === 'listRow') {
    return (
      <div className={cn(styles.toolbarListRoot, className)}>
        <div className={styles.toolbarListLeading}>
          {!order.isPayment && order.user.id === userId && (
            <button className={styles.btnPay} type="button" onClick={() => onPay(order.id)}>
              {t('pay', { price: getOrderPrice(order) })}
            </button>
          )}
          {cancelOrderButton}
        </div>
        <div className={styles.toolbarListArrows}>
          {statusArrowButtons}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(styles.panel, className)}>
      <h4 className={styles.title}>{t('actions.adminPanelTitle')}</h4>
      <div className={styles.row}>
        {!order.isPayment && order.user.id === userId && (
          <button className={styles.btnPay} type="button" onClick={() => onPay(order.id)}>
            {t('pay', { price: getOrderPrice(order) })}
          </button>
        )}
        {cancelOrderButton}
        {statusArrowButtons}
      </div>
    </div>
  );
};
