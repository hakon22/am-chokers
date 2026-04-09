import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminDeferredPublications } from '@/themes/v1/components/admin/V1AdminDeferredPublications';
import { V2AdminDeferredPublications } from '@/themes/v2/components/admin/V2AdminDeferredPublications';

const DeferredPublication = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminDeferredPublications />;
  return <V1AdminDeferredPublications />;
};

export default DeferredPublication;
