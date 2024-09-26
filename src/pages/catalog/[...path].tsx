import type { InferGetServerSidePropsType } from 'next';
import ImageGallery from 'react-image-gallery';
import Link from 'next/link';
import choker2 from '@/images/choker2.jpg';
import choker3 from '@/images/choker3.jpg';
import { ImageHover } from '@/components/ImageHover';
import translate from '@/utilities/translate';
import { useRef } from 'react';
import routes from '@/routes';
import i18n from '@/locales';
import { Button } from 'antd';
import { HeartOutlined } from '@ant-design/icons';

export const getServerSideProps = async ({ params }: { params: { path: string[] } }) => {
  const items = [
    {
      id: 1, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 1', description: '1000 ₽', className: 'me-3', group: 'necklace',
    },
    {
      id: 2, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 2', description: '2000 ₽', className: 'me-3', group: 'bracelets',
    },
    {
      id: 3, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 3', description: '3000 ₽', className: 'me-3', group: 'earrings',
    },
    {
      id: 4, images: [choker2.src, choker3.src], height: 400, title: 'Информация о товаре 4', description: '4000 ₽', className: 'me-3', group: 'accessories',
    },
  ];

  const { t } = i18n;

  const accumulator: string[] = [];

  const links = [...Object.keys(t('modules.navbar.menu.catalog', { returnObjects: true })), ...items.reduce((acc, item) => {
    if (!acc.includes(translate(item.title))) {
      acc.push(translate(item.title));
    }
    return acc;
  }, accumulator)];

  const { path } = params;

  if (path.length > 2 || path.find((url) => !links.includes(url))) {
    return {
      redirect: {
        permanent: false,
        destination: '/',
      },
    };
  }

  const [group, item] = path;

  return {
    props: item
      ? {
        item: items.find((itm) => translate(itm.title) === item),
      }
      : {
        items: items.filter((itm) => itm.group === group),
      },
  };
};

const Item = ({ item, items }:
  InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const galleryRef = useRef<ImageGallery>(null);

  return item ? (
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
          <h1 className="mb-4 fs-3">{item.title}</h1>
          <p className="fs-5 mb-4">{item.description}</p>
          <div className="d-flex align-items-center gap-5 mb-4">
            <Button className="button border-button fs-5">В корзину</Button>
            <button className="icon-button" type="button">
              <HeartOutlined className="icon" />
              <span className="visually-hidden">Избранное</span>
            </button>
          </div>
          <p className="lh-lg" style={{ letterSpacing: '0.5px' }}>Lorem ipsum dolor sit amet consectetur. Mi rhoncus venenatis magna sagittis dignissim. Et sed nisi purus quis facilisi est. Massa eget vel eros facilisis etiam commodo.</p>
          <div className="d-flex flex-column gap-3">
            <div className="d-flex flex-column gap-2">
              <span>Состав:</span>
              <span>Стеклянный бисер, варисцит, гематит, кристаллы, бижутерный сплав</span>
            </div>
            <div className="d-flex flex-column gap-2">
              <span>Длина:</span>
              <span>40см</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="d-flex col-12 justify-content-between">
      {items?.map((itm) => (
        <Link href={`${routes.catalog}/${itm.group}/${translate(itm.title)}`} style={{ width: '23%' }} key={itm.id}>
          <ImageHover
            className={itm.className}
            height={itm.height}
            images={itm.images}
            title={itm.title}
            description={itm.description}
          />
        </Link>
      ))}
    </div>
  );
};

export default Item;
