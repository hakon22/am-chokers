import { useTranslation } from 'react-i18next';
import { List } from 'antd';

import { useAppSelector } from '@/utilities/hooks';
import { ImageHover } from '@/components/ImageHover';
import { Favorites as FavoritesButton } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';

export const Favorites = () => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { favorites } = useAppSelector((state) => state.user);

  const height = 170;

  return (
    <List
      dataSource={favorites}
      className="d-flex flex-column justify-content-center align-items-between col-8 w-100"
      renderItem={(item) => (
        <List.Item>
          <div className="d-flex gap-4" style={{ width: height, height }}>
            <ImageHover
              className="ms-3"
              height={height}
              width={height}
              images={item.images ?? []}
            />
            <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
              <div className="d-flex flex-column gap-3">
                <span className="lh-1">{item.name}</span>
                <span>{tPrice('price', { price: item.price })}</span>
              </div>
              <div className="d-flex gap-4">
                <CartControl id={item.id} name={item.name} />
                <FavoritesButton id={item.id} className="fs-5" outlined={true} />
              </div>
            </div>
          </div>
        </List.Item>
      )}
    />);
};
