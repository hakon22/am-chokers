import { useEffect } from 'react';
import { useRouter } from 'next/router';

import { useAppSelector } from '@/utilities/hooks';
import { routes } from '@/routes';

export const useAccessHandler = () => {
  const router = useRouter();
  const { isAdmin } = useAppSelector((state) => state.user);

  const adminPaths = Object.values(routes.page.admin);

  useEffect(() => {
    if (adminPaths.some(path => router.asPath.startsWith(path))) {
      const timeout = setTimeout(() => {
        if (!isAdmin) {
          router.push(routes.page.base.homePage);
        }
      }, process.env.NODE_ENV === 'development' ? 2000 : 300);
      
      return () => clearTimeout(timeout);
    }
  }, [isAdmin, router.asPath]);
};
