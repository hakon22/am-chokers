import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Helmet } from '@/components/Helmet';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';

import Meta from 'antd/es/card/Meta';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });

  return (
    <div className="d-flex justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <Image src={choker} alt={t('title')} className="pe-none" priority style={{ zIndex: 1 }} />
        <h1>{t('title')}</h1>
        <div className="w-100 d-flex justify-content-around">
          <h3 className="d-flex align-items-end">Новинки</h3>
          <ImageHover
            width={250}
            height={400}
            images={[choker2, choker3]}
          />
          <ImageHover
            width={250}
            height={400}
            images={[choker2, choker3]}
          />
        </div>
        <div className="w-100 d-flex justify-content-around mt-5">
          <h3 className="d-flex align-items-top">Бестселлеры</h3>
          <ImageHover
            width={250}
            height={400}
            images={[choker2, choker3]}
          />
          <ImageHover
            width={250}
            height={400}
            images={[choker2, choker3]}
          />
          <ImageHover
            width={500}
            height={400}
            images={[choker2, choker3]}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
