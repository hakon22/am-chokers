import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminReviews } from '@/themes/v1/components/admin/V1AdminReviews';
import { V2AdminReviews } from '@/themes/v2/components/admin/V2AdminReviews';

const Reviews = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminReviews />;
  return <V1AdminReviews />;
};

export default Reviews;
