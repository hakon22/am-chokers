import { useAppSelector } from '@/hooks/reduxHooks';
import Page from '@/pages/profile/[...path]';

const AdminSettings = () => {
  const { isAdmin } = useAppSelector((state) => state.user);

  return isAdmin ? <Page path={['adminSettings']} /> : null;
};

export default AdminSettings;
