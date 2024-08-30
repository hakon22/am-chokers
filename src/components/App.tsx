import { useEffect, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import { Spin } from 'antd';
import { useAppSelector } from '@/utilities/hooks';
import useErrorHandler from '@/utilities/useErrorHandler';
import useAuthHandler from '@/utilities/useAuthHandler';
import { SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';

const storageKey = process.env.NEXT_PUBLIC_STORAGE_KEY ?? '';

export const App = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });
  const [isLoaded, setIsLoaded] = useState(false);

  const { error, token, loadingStatus } = useAppSelector((state) => state.user);
  const { isSubmit } = useContext(SubmitContext);

  useErrorHandler(error);
  useAuthHandler();

  useEffect(() => {
    const tokenStorage = window.localStorage.getItem(storageKey);
    if (!tokenStorage || token) {
      setIsLoaded(true);
    }
  }, [token, loadingStatus]);

  return isLoaded ? (
    <>
      <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" />
      <NavBar />
      <div className="container">
        {children}
      </div>
    </>
  ) : (
    <div className="spinner">
      <Spinner animation="border" variant="primary" role="status" />
    </div>
  );
};
