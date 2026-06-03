import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminSalesReport } from '@/themes/v1/components/admin/V1AdminSalesReport';
import { V2AdminSalesReport } from '@/themes/v2/components/admin/V2AdminSalesReport';

const SalesReport = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') {
    return <V2AdminSalesReport />;
  }
  return <V1AdminSalesReport />;
};

export default SalesReport;
