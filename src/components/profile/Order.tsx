import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Tag } from 'antd';
import moment from 'moment';
import { useEffect, useState } from 'react';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppSelector } from '@/utilities/hooks';
import { selectors } from '@/slices/orderSlice';
import { routes } from '@/routes';
import { ImageHover } from '@/components/ImageHover';
import { getOrderStatusColor } from '@/utilities/getOrderStatusColor';
import { getOrderPrice } from '@/utilities/getOrderPrice';
import { Spinner } from '@/components/Spinner';

export const Order = ({ orderId, t }: { orderId: number; t: TFunction }) => {
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });

  const router = useRouter();

  const [isLoaded, setIsLoaded] = useState(true);

  const { loadingStatus  } = useAppSelector((state) => state.order);
  const order = useAppSelector((state) => selectors.selectById(state, orderId));

  const height = 100;

  useEffect(() => {
    if (loadingStatus === 'finish' && !order) {
      router.replace(routes.orderHistory);
      setIsLoaded(false);
    } else if (order) {
      setIsLoaded(false);
    }
  }, [order, loadingStatus]);

  return order
    ? (
      <div className="d-flex flex-column gap-4" style={{ width: '90%' }}>
        <Badge.Ribbon text={tOrders(`statuses.${order.status}`)} color={getOrderStatusColor(order)}>
          <Card>
            <div className="d-flex col-12" style={{ lineHeight: 0.5 }}>
              <div className="d-flex flex-column justify-content-between col-12">
                <div className="d-flex flex-column font-oswald">
                  <div className="d-flex mb-5 justify-content-between align-items-center">
                    <span className="fs-5 fw-bold">{t('orderDate', { date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}</span>
                    <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                      <span>{tOrders('payment')}</span>
                      <span className="fw-bold">{tOrders('price', { price: getOrderPrice(order) })}</span>
                    </Tag>
                  </div>
                  <div className="d-flex flex-column fs-6 gap-4 mb-5">
                    <span>{t('delivery')}</span>
                    <span>{t('deliveryDate')}</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-3">
                  {order.positions.map((orderPosition) => (
                    <div key={orderPosition.id} className="d-flex justify-content-between align-items-center gap-3" style={{ height }}>
                      <div className="d-flex align-items-center gap-3 h-100">
                        <ImageHover
                          height={height}
                          width={height}
                          images={orderPosition.item.images}
                        />
                        <div className="d-flex flex-column justify-content-between fs-6 h-100">
                          <span className="font-oswald fs-5-5 lh-1" style={{ fontWeight: 500 }}>{orderPosition.item.name}</span>
                          <span className="lh-1">{t('countPrice', { count: orderPosition.count, price: (orderPosition.price - orderPosition.discountPrice) * orderPosition.count })}</span>
                        </div>
                      </div>
                      <Button className="button border-button py-2 fs-6" title={t('evaluateItem')}>{t('evaluateItem')}</Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Badge.Ribbon>
      </div>
    )
    : <Spinner isLoaded={isLoaded} />;
};
