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
  ];

  useEffect(() => {
    if (role === UserRoleEnum.MEMBER && adminPaths.includes(router.asPath)) {
      router.push(routes.homePage);
    }
  }, [role, router.asPath]);
};
