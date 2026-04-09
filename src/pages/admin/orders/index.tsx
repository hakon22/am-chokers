import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminOrders } from '@/themes/v1/components/admin/V1AdminOrders';
import { V2AdminOrders } from '@/themes/v2/components/admin/V2AdminOrders';

const Orders = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminOrders />;
  return <V1AdminOrders />;
};

export default Orders;
