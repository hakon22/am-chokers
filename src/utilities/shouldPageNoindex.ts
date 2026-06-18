/**
 * Определяет, нужен ли noindex для маршрута (закрытые и служебные страницы)
 * @param pathname - router.pathname Next.js
 * @returns true, если страница не должна индексироваться
 */
export const shouldPageNoindex = (pathname: string): boolean => {
  if (pathname.startsWith('/admin')) {
    return true;
  }

  if (pathname.startsWith('/telegram')) {
    return true;
  }

  if (pathname.startsWith('/profile')) {
    return true;
  }

  const exactNoindexPaths = new Set([
    '/cart',
    '/login',
    '/signup',
    '/recovery',
    '/payment/success',
    '/payment/error',
    '/404',
  ]);

  return exactNoindexPaths.has(pathname);
};
