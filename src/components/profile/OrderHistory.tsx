import type { TFunction } from 'i18next';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Card, Tag } from 'antd';
import moment from 'moment';
import Image from 'next/image';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppSelector } from '@/utilities/hooks';
import { selectors } from '@/slices/orderSlice';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { routes } from '@/routes';

const maxPhoto = 3;

export const OrderHistory = ({ t }: { t: TFunction }) => {
  const router = useRouter();

  const orders = useAppSelector(selectors.selectAll);

  const badgeColors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NEW]: 'blue',
    [OrderStatusEnum.ASSEMBLY]: 'gold',
    [OrderStatusEnum.CANCELED]: 'volcano',
    [OrderStatusEnum.DELIVERING]: 'yellow',
    [OrderStatusEnum.DELIVERED]: 'orange',
    [OrderStatusEnum.COMPLETED]: 'green',
  };

  return orders.length
    ? (
      <div className="d-flex flex-column gap-4 mb-3" style={{ width: '90%' }}>
        {orders.map((order) => (
          <Badge.Ribbon key={order.id} text={t(`statuses.${order.status}`)} color={badgeColors[order.status]}>
            <Card hoverable onClick={() => router.push(`${routes.orderHistory}/${order.id}`)}>
              <div className="d-flex justify-content-between" style={{ lineHeight: 0.5 }}>
                <div className="d-flex flex-column justify-content-between">
                  <div className="d-flex flex-column">
                    <span className="fs-6 mb-3">{t('orderNumber', { id: order.id })}</span>
                    <span className="text-muted">{moment(order.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                  </div>
                  <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e' }}>
                    <span>{t('payment')}</span>
                    <span className="fw-bold">{t('price', { price: order.positions.reduce((acc, position) => acc + (position.price - position.discount), 0) })}</span>
                  </Tag>
                </div>
                <div>
                  {order.positions.map((position) =>
                    <div key={position.id} className="d-flex gap-4">{position.item.images.map((image, index) =>
                      index < maxPhoto
                        ? <Image key={image.id} src={`${image.path}/${image.name}`} width={100} height={100} alt={position.item.name} />
                        : index === maxPhoto
                          ? <div key={image.id} className="d-flex align-items-center fs-6">
                            <span style={{ backgroundColor: '#eaeef6', borderRadius: '10px', padding: '12px' }}>{`+ ${position.item.images.length - maxPhoto}`}</span>
                          </div>
                          : null)}
                    </div>)}
                </div>
              </div>
            </Card>
          </Badge.Ribbon>
        ))}
      </div>
    )
    : <Alert message={t('notFound')} type="success" style={{ height: '3rem' }} />;
};
