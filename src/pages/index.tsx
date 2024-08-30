import { useTranslation } from 'react-i18next';
import { Helmet } from '@/components/Helmet';
import { NavBar } from '@/components/NavBar';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });

  return (
    <div className="d-flex justify-content-center anim-show">
      <Helmet title={t('title')} description={t('description')} />
      <NavBar />
      <div className="my-4 col-12 d-flex flex-column align-items-center gap-3">
        <h1>{t('title')}</h1>
      </div>
    </div>
  );
};

export default Index;
