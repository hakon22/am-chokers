import { useTranslation } from 'react-i18next';
import { List } from 'antd';
import Link from 'next/link';
import cn from 'classnames';

import { useAppSelector } from '@/hooks/reduxHooks';
import { ImageHover } from '@/components/ImageHover';
import { Favorites as FavoritesButton } from '@/components/Favorites';
import { CartControl } from '@/components/CartControl';
import { getHref } from '@/utilities/getHref';
import { NotFoundContent } from '@/components/NotFoundContent';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';

export const Favorites = () => {
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  const { favorites, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const coefficient = 1.3;

  const width = 130;
  const height = width * coefficient;

  return (
    <List
      dataSource={[...(favorites || [])]?.sort((a, b) => {
        const aDeleted = a.deleted ? 1 : 0; // Если deleted true, присваиваем 1, иначе 0
        const bDeleted = b.deleted ? 1 : 0; // Аналогично для b
        return aDeleted - bDeleted; // Возвращаем разницу, чтобы отсортировать
      })}
      locale={{
        emptyText: <NotFoundContent />,
      }}
      className="d-flex flex-column align-items-between col-8 w-100"
      renderItem={(item) => (
        <List.Item className="ms-xl-3">
          <div className="d-flex gap-2-5 gap-xl-4 font-oswald">
            <ImageHover
              height={height}
              width={width}
              deleted={!!item.deleted}
              outStock={item.outStock}
              images={item.images ?? []}
            />
            <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
              <Link href={getHref(item)} className={cn('d-flex flex-column gap-3', { 'opacity-50': item.deleted || item.outStock })}>
                <span className="lh-1">{item.translations.find((translation) => translation.lang === lang)?.name}</span>
                <span>{tPrice('price', { price: item.price - item.discountPrice })}</span>
              </Link>
              <div className="d-flex align-items-center gap-4">
                <CartControl id={item.id} />
                <FavoritesButton id={item.id} className="fs-5" outlined={true} />
              </div>
            </div>
          </div>
        </List.Item>
      )}
    />);
};
