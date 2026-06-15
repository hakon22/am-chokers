import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminMetricaReport } from '@/themes/v1/components/admin/V1AdminMetricaReport';
import { V2AdminMetricaReport } from '@/themes/v2/components/admin/V2AdminMetricaReport';

const Metrica = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') {
    return <V2AdminMetricaReport />;
  }
  return <V1AdminMetricaReport />;
};

export default Metrica;
