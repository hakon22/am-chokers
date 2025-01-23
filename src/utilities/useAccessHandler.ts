import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useAppSelector } from '@/utilities/hooks';
import { routes } from '@/routes';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';

export const useAccessHandler = () => {
  const router = useRouter();
  const { role } = useAppSelector((state) => state.user);

  const adminPaths = [
    routes.newItem,
    routes.itemGroupsControl,
    routes.itemCollectionsControl,
    routes.allOrders,
    routes.moderationOfReview,
    routes.promotionalCodes,
    routes.itemList,
    routes.compositionsControl,
  ];

  useEffect(() => {
    if (adminPaths.includes(router.asPath)) {
      const timeout = setTimeout(() => {
        if (role !== UserRoleEnum.ADMIN) {
          router.push(routes.homePage);
        }
      }, 300);
      
      return () => clearTimeout(timeout);
    }
  }, [role, router.asPath]);
};
