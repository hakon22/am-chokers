import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useAppSelector } from '@/hooks/reduxHooks';
import { routes } from '@/routes';
import { Spinner } from '@/components/Spinner';

/**
 * Точка входа Mini App: перенаправляет на список заказов пользователя или админа
 */
const TelegramIndexPage = () => {
  const router = useRouter();
  const { id: userId, isAdmin } = useAppSelector((state) => state.user);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const targetPath = isAdmin ? routes.page.telegram.adminOrders : routes.page.telegram.orders;
    router.replace(targetPath);
  }, [userId, isAdmin, router]);

  return <Spinner isLoaded={false} />;
};

export default TelegramIndexPage;
