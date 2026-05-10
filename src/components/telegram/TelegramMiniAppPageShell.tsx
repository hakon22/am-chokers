import { useContext, useEffect, type JSX, type ReactNode } from 'react';

import { MobileContext, VersionContext } from '@/components/Context';

/**
 * Даёт Mini App те же боковые поля, что и основной сайт (`main.container`), и для v2 подключает классы темы на body (без Layout).
 * @param children - страница Mini App
 */
export const TelegramMiniAppPageShell = ({ children }: { children: ReactNode }): JSX.Element => {
  const { version } = useContext(VersionContext);
  const { isMobile } = useContext(MobileContext);

  useEffect(() => {
    if (version !== 'v2') {
      return undefined;
    }
    document.body.classList.add('v2-theme');
    return () => {
      document.body.classList.remove('v2-theme');
    };
  }, [version]);

  useEffect(() => {
    if (version !== 'v2' || !isMobile) {
      return undefined;
    }
    document.body.classList.add('v2-mobile');
    return () => {
      document.body.classList.remove('v2-mobile');
    };
  }, [version, isMobile]);

  return (
    <main className="container" style={{ paddingTop: 24, paddingBottom: 40, minHeight: '100vh' }}>
      {children}
    </main>
  );
};
