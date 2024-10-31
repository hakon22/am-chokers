import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { useAppSelector } from '@/utilities/hooks';
import { useErrorHandler } from '@/utilities/useErrorHandler';
import { useAuthHandler } from '@/utilities/useAuthHandler';
import { SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';
import { useRootStyle } from '@/utilities/useRootStyle';
import { Spinner } from '@/components/Spinner';

export const App = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });

  const [isLoaded, setIsLoaded] = useState(false);

  const { error: userError } = useAppSelector((state) => state.user);
  const { error: orderError } = useAppSelector((state) => state.order);
  const { isSubmit } = useContext(SubmitContext);

  useErrorHandler(userError, orderError);
  useAuthHandler();
  useRootStyle();

  useEffect(() => {
    setTimeout(setIsLoaded, 1000, true);
  }, []);

  return (
    <>
      {isLoaded ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : <Spinner isLoaded={isLoaded} />}
      <header>
        <NavBar />
        <Breadcrumb />
      </header>
      <main className="container">
        {children}
      </main>
      <footer className="footer">
        <Footer />
      </footer>
    </>
  );
};
