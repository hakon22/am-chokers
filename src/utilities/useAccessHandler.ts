import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useAppSelector } from '@/utilities/hooks';
import { routes } from '@/routes';

export const useAccessHandler = () => {
  const router = useRouter();
  const { isAdmin } = useAppSelector((state) => state.user);

  const adminPaths = [
    routes.newItem,
    routes.itemGroupsControl,
    routes.itemCollectionsControl,
    routes.allOrders,
    routes.moderationOfReview,
    routes.promotionalCodes,
    routes.itemList,
    routes.compositionsControl,
    routes.colorsControl,
    routes.cartReport,
    routes.messageReport,
    routes.userCard,
    routes.userList,
  ];

  useEffect(() => {
    if (adminPaths.some(path => router.asPath.startsWith(path))) {
      const timeout = setTimeout(() => {
        if (!isAdmin) {
          router.push(routes.homePage);
        }
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, router.asPath]);
};
