import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminItemList } from '@/themes/v1/components/admin/V1AdminItemList';
import { V2AdminItemList } from '@/themes/v2/components/admin/V2AdminItemList';

const ItemList = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminItemList />;
  return <V1AdminItemList />;
};

export default ItemList;
