import type { InferGetServerSidePropsType } from 'next';
import ImageGallery from 'react-image-gallery';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { Breadcrumb } from '@/components/Breadcrumb';
import translate from '@/utilities/translate';
import { useRef } from 'react';

export const getServerSideProps = async ({ params }: { params: { item: string[] } }) => {
  const { item } = params;

  const items = [
    {
      id: 1, images: [choker2, choker3], height: 400, title: 'Информация о товаре 1', description: '1000 ₽', className: 'me-3', group: 'necklace', hrefName: 'name1',
    },
    {
      id: 2, images: [choker2, choker3], height: 400, title: 'Информация о товаре 2', description: '2000 ₽', className: 'me-3', group: 'bracelets', hrefName: 'name2',
    },
    {
      id: 3, images: [choker2, choker3], height: 400, title: 'Информация о товаре 3', description: '3000 ₽', className: 'me-3', group: 'earrings', hrefName: 'name3',
    },
    {
      id: 4, images: [choker2, choker3], height: 400, title: 'Информация о товаре 4', description: '4000 ₽', className: 'me-3', group: 'accessories', hrefName: 'name4',
    },
  ];

  console.log(item);

  return {
    props: {
      item: item.length > 1 ? items.find((it) => translate(it.title) === item[item.length - 1]) : null,
    },
  };
};

const Item = ({ item }:
  InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const galleryRef = useRef<ImageGallery>(null);

  return item ? (
    <>
      <Breadcrumb name={item?.title} />
      <div className="d-flex mb-5">
        <div className="col-6">
          <ImageGallery
            ref={galleryRef}
            items={[{ original: choker2.src, thumbnail: choker2.src }, { original: choker3.src, thumbnail: choker3.src }, { original: choker2.src, thumbnail: choker2.src }]}
            infinite
            showNav
            onScreenChange={(fullscreen) => (fullscreen ? document.documentElement.style.setProperty('--galleryWidth', 'calc(100% - 110px)') : document.documentElement.style.setProperty('--galleryWidth', 'calc(80% - 110px)'))}
            showPlayButton={false}
            thumbnailPosition="left"
            onClick={() => galleryRef.current?.fullScreen()}
          />
        </div>
        <div className="col-6">
          <div className="d-flex flex-column">
            <h1 className="mb-5">{item.title}</h1>
            <p>{item.description}</p>
          </div>
        </div>
      </div>
    </>
  ) : null;
};

export default Item;
