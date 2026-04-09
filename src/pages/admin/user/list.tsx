import { useContext } from 'react';

import { VersionContext } from '@/components/Context';
import { V1AdminUserList } from '@/themes/v1/components/admin/V1AdminUserList';
import { V2AdminUserList } from '@/themes/v2/components/admin/V2AdminUserList';

const UserList = () => {
  const { version } = useContext(VersionContext);
  if (version === 'v2') return <V2AdminUserList />;
  return <V1AdminUserList />;
};

export default UserList;
