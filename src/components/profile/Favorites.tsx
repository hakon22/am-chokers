import { useTranslation } from 'react-i18next';
import { List } from 'antd';
import Link from 'next/link';

import { useAppSelector } from '@/utilities/hooks';
import { ImageHover } from '@/components/ImageHover';
import { Favorites as FavoritesButton } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { getHref } from '@/utilities/getHref';
import { NotFoundContent } from '@/components/NotFoundContent';

export const Favorites = () => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { favorites } = useAppSelector((state) => state.user);

  const width = 130;
  const height = 170;

  return (
    <List
      dataSource={favorites}
      locale={{
        emptyText: <NotFoundContent />,
      }}
      className="d-flex flex-column align-items-between col-8 w-100"
      renderItem={(item) => (
        <List.Item className="ms-3">
          <div className="d-flex gap-4" style={{ width, height }}>
            <ImageHover
              height={height}
              width={width}
              images={item.images ?? []}
            />
            <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
              <Link href={getHref(item)} className="d-flex flex-column gap-3">
                <span className="lh-1">{item.name}</span>
                <span>{tPrice('price', { price: item.price })}</span>
              </Link>
              <div className="d-flex gap-4">
                <CartControl id={item.id} />
                <FavoritesButton id={item.id} className="fs-5" outlined={true} />
              </div>
            </div>
          </div>
        </List.Item>
      )}
    />);
};
