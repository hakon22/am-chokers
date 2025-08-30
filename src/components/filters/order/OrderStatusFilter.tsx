import { Select, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { NotFoundContent } from '@/components/NotFoundContent';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getOrderStatusTranslate } from '@/utilities/order/getOrderStatusTranslate';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const OrderStatusFilter = ({ statuses, setStatuses, lang }: { statuses: OrderStatusEnum[]; lang: UserLangEnum; setStatuses: React.Dispatch<React.SetStateAction<OrderStatusEnum[]>>; }) => {
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });

  const router = useRouter();

  useEffect(() => {
    router.push({
      query: { 
        ...router.query, 
        statuses,
      },
    },
    undefined,
    { shallow: true });
  }, [statuses.length]);

  return (
    <Select
      key="select"
      mode="multiple"
      allowClear
      className="col-12 col-xl-6"
      size="large"
      notFoundContent={<NotFoundContent />}
      optionFilterProp="label"
      value={statuses}
      filterOption={(input, option) => 
        option?.label.props.children.toLowerCase().includes(input.toLowerCase())
      }
      placeholder={tOrders('selectStatuses')}
      onChange={(state) => setStatuses(state)}
      onClear={() => setStatuses([])}
      options={Object.values(OrderStatusEnum).map((status) => ({ label: <Tag color={getOrderStatusColor(status)}>{getOrderStatusTranslate(status, lang)}</Tag>, value: status }))}
    />
  );
};
