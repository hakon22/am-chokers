import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { useAppSelector } from '@/utilities/hooks';
import useErrorHandler from '@/utilities/useErrorHandler';
import useAuthHandler from '@/utilities/useAuthHandler';
import { SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Footer } from '@/components/Footer';

export const App = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });

  const [isLoading, setIsLoading] = useState(false);

  const { error } = useAppSelector((state) => state.user);
  const { isSubmit } = useContext(SubmitContext);

  useErrorHandler(error);
  useAuthHandler();

  useEffect(() => {
    setIsLoading(true);
  }, []);

  return (
    <>
      {isLoading ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : null}
      <header>
        <NavBar />
      </header>
      <main className="container">
        {children}
      </main>
      <footer className="footer" data-aos="fade-up" data-aos-anchor-placement="top-bottom">
        <Footer />
      </footer>
    </>
  );
};
