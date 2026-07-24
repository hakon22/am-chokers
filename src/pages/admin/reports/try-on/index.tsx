import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminTryOnReport } from '@/themes/v1/components/admin/V1AdminTryOnReport';
import { V2AdminTryOnReport } from '@/themes/v2/components/admin/V2AdminTryOnReport';

const TryOnReport = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') {
    return <V2AdminTryOnReport />;
  }
  return <V1AdminTryOnReport />;
};

export default TryOnReport;
