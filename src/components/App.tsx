import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Spin } from 'antd';
import { useAppSelector } from '@/utilities/hooks';
import useErrorHandler from '@/utilities/useErrorHandler';
import useAuthHandler from '@/utilities/useAuthHandler';
import { SubmitContext } from '@/components/Context';
import { NavBar } from '@/components/NavBar';

export const App = ({ children }: { children: JSX.Element }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'spinner' });

  const { error, loadingStatus } = useAppSelector((state) => state.user);
  const { isSubmit } = useContext(SubmitContext);

  useErrorHandler(error);
  useAuthHandler();

  return (
    <>
      {loadingStatus === 'finish' ? <Spin tip={t('loading')} spinning={isSubmit} fullscreen size="large" /> : null}
      <NavBar />
      <div className="container">
        {children}
      </div>
    </>
  );
};
