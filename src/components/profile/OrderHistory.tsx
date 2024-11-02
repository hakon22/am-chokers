import axios from 'axios';
import { DeleteOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons';
import { TFunction } from 'i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert, Badge, Card, List, Popover,
} from 'antd';
import moment from 'moment';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { selectors } from '@/slices/orderSlice';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import type { OrderPositionInterface } from '@/types/order/OrderPosition';

export const OrderHistory = ({ t }: { t: TFunction }) => {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const orders = useAppSelector(selectors.selectAll);

  const { setIsSubmit } = useContext(SubmitContext);

  const positionList = (positions: OrderPositionInterface[]) => (
    <List
      itemLayout="horizontal"
      dataSource={positions}
      renderItem={(position) => (
        <List.Item>
          <List.Item.Meta
            title={position.item.name}
            description={t('positions.price', { price: position.price })}
          />
        </List.Item>
      )}
    />
  );

  const actions = [
    <EditOutlined key="edit" className="fs-5" />,
    <SettingOutlined key="setting" className="fs-5" />,
    <DeleteOutlined key="delete" className="fs-5" />,
  ];

  const badgeColors: Record<OrderStatusEnum, string> = {
    [OrderStatusEnum.NEW]: 'blue',
    [OrderStatusEnum.ASSEMBLY]: 'gold',
    [OrderStatusEnum.PAYMENT]: 'magenta',
    [OrderStatusEnum.DELIVERING]: 'yellow',
    [OrderStatusEnum.DELIVERED]: 'orange',
    [OrderStatusEnum.COMPLETED]: 'green',
  };

  return orders.length
    ? (
      <div className="d-flex flex-column gap-4 mb-3" style={{ width: '90%' }}>
        {orders.map((order) => (
          <Popover key={order.id} placement="bottom" title={t('positions.title')} trigger="hover" content={positionList(order.positions)}>
            <div>
              <Badge.Ribbon text={t(`statuses.${order.status}`)} color={badgeColors[order.status as OrderStatusEnum]}>
                <Card actions={actions} hoverable>
                  <Card.Meta
                    title={t('orderNumber', { id: order.id })}
                    description={moment(order.created).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}
                  />
                </Card>
              </Badge.Ribbon>
            </div>
          </Popover>
        ))}
      </div>
    )
    : <Alert message={t('notFound')} type="success" />;
};
