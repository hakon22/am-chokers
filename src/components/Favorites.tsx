import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { HeartFilled, HeartOutlined, HeartTwoTone } from '@ant-design/icons';
import cn from 'classnames';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { addFavorites, removeFavorites } from '@/slices/userSlice';

export const Favorites = ({ id, className, outlined = false }: { id: number; outlined?: boolean; className?: string; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const dispatch = useAppDispatch();

  const { id: userId, favorites } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  const inFavorites = favorites?.find((item) => item.id === id);

  const totalClassName = cn('icon', className);

  const favoritesHandler = async () => {
    setIsSubmit(true);
    await dispatch(inFavorites ? removeFavorites(inFavorites.id) : addFavorites(id));
    setIsSubmit(false);
  };

  return userId ? (
    <button className="icon-button" type="button" title={t('favorites')} onClick={favoritesHandler}>
      {inFavorites
        ? <HeartFilled className={totalClassName} style={{ color: '#4d689e' }} />
        : outlined
          ? <HeartOutlined className={totalClassName} />
          : <HeartTwoTone className={totalClassName} />}
      <span className="visually-hidden">{t('favorites')}</span>
    </button>
  ) : null;
};
