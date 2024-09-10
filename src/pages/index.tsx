import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { Helmet } from '@/components/Helmet';
import choker from '@/images/choker.png';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';

const Index = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.index' });

  return (
    <div className="d-flex justify-content-center">
      <Helmet title={t('title')} description={t('description')} />
      <div className="mb-5 col-12 d-flex flex-column align-items-center gap-3">
        <Image src={choker} alt={t('title')} className="pe-none" priority style={{ zIndex: 2 }} />
        <div className="index-block">
          <div className="d-flex col-11">
            <h3 className="d-flex align-items-end col-2">Новинки</h3>
            <ImageHover
              className="col-4"
              height={400}
              images={[choker2, choker3]}
              title="Информация о товаре"
              description="5000 &#8381;"
            />
            <div className="col-1" />
            <ImageHover
              className="col-4"
              height={400}
              images={[choker2, choker3]}
              title="Информация о товаре"
              description="5000 &#8381;"
            />
          </div>
          <div className="d-flex flex-column col-11" style={{ gap: '4rem' }}>
            <h3>Бестселлеры</h3>
            <div className="d-flex">
              <div className="d-flex flex-column col-4 row-gap-5">
                <ImageHover
                  className="col-6 align-self-start"
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                />
                <ImageHover
                  className="col-6 align-self-end"
                  height={200}
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                />
              </div>
              <div className="col-1" />
              <div className="d-flex col-6">
                <ImageHover
                  className="w-100"
                  height="100%"
                  images={[choker2, choker3]}
                  title="Информация о товаре"
                  description="5000 &#8381;"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
