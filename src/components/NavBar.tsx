import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/utilities/hooks';

export const NavBar = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.navbar' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { id, role } = useAppSelector((state) => state.user);

  return (
    <div>Меню</div>
  );
};
