import type { TFunction } from 'i18next';
import { useRouter } from 'next/navigation';
import { Alert, Badge, Card, Tag, Tooltip } from 'antd';
import moment from 'moment';
import Image from 'next/image';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppSelector } from '@/utilities/hooks';
import { selectors } from '@/slices/orderSlice';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { routes } from '@/routes';
import { truncateText } from '@/utilities/truncateText';

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
              <div className="d-flex col-12" style={{ lineHeight: 0.5 }}>
                <div className="d-flex flex-column justify-content-between col-4">
                  <div className="d-flex flex-column">
                    <span className="fs-6 mb-3">{t('orderNumber', { id: order.id })}</span>
                    <span className="text-muted">{moment(order.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
                  </div>
                  <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                    <span>{t('payment')}</span>
                    <span className="fw-bold">{t('price', { price: order.positions.reduce((acc, position) => acc + (position.price - position.discount), 0) })}</span>
                  </Tag>
                </div>
                <div className="d-flex flex-column col-8 gap-2">
                  {order.positions.map((position) =>
                    <Tooltip key={position.id} title={position.item.name} className="d-flex align-items-center gap-3" placement="left" color="#4d689e">
                      <span className="col-2 font-oswald lh-1">{truncateText(position.item.name)}</span>
                      <div className="d-flex col-10 gap-2">{position.item.images.map((image, index) =>
                        index < maxPhoto
                          ? <Image key={image.id} src={image.src} width={100} height={100} alt={position.item.name} />
                          : index === maxPhoto
                            ? <div key={image.id} className="d-flex align-items-center fs-6">
                              <span style={{ backgroundColor: '#eaeef6', borderRadius: '10px', padding: '12px' }}>{`+ ${position.item.images.length - maxPhoto}`}</span>
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
