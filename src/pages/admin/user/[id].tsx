import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { Checkbox, Descriptions, type DescriptionsProps } from 'antd';
import moment from 'moment';
import { chunk } from 'lodash';
import Link from 'next/link';
import cn from 'classnames';
import type { InferGetServerSidePropsType } from 'next';

import { Helmet } from '@/components/Helmet';
import { useAppSelector } from '@/utilities/hooks';
import { MobileContext, SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import { UserRoleEnum, translateUserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { BackButton } from '@/components/BackButton';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import type { UserCardInterface } from '@/types/user/User';
import type { ParamsIdInterface } from '@server/types/params.id.interface';


export const getServerSideProps = async ({ params }: { params: { id: string; } }) => {
  const { id } = params;
  return {
    props: { id: +id },
  };
};

const User = ({ id }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.user' });
  const { t: tPrice } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const { role } = useAppSelector((state) => state.user);
  const { axiosAuth } = useAppSelector((state) => state.app);

  const coefficient = 1.3;

  const width = 80;
  const height = width * coefficient;

  const [user, setUser] = useState<UserCardInterface>();

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: t('username'),
      children: user?.name,
    },
    {
      key: '2',
      label: t('phone'),
      children: <Link href={`tel:+${user?.phone}`}>{user?.phone}</Link>,
    },
    {
      key: '3',
      label: t('telegram'),
      children: <Checkbox checked={!!user?.telegramId} />,
    },
    {
      key: '4',
      label: t('role'),
      children: translateUserRoleEnum[user?.role as UserRoleEnum],
    },
    {
      key: '5',
      label: t('signupDate'),
      children: moment(user?.created).format(DateFormatEnum.DD_MM_YYYY),
    },
    {
      key: '6',
      label: t('lastActivity'),
      children: moment(user?.updated).format(DateFormatEnum.DD_MM_YYYY),
    },
    {
      key: '7',
      label: t('amount'),
      children: tPrice('price', { price: user?.amount }),
    },
    {
      key: '8',
      label: t('orders'),
      children: <Link href={`${routes.allOrders}?userId=${id}`}>{user?.orders.length}</Link>,
    },
    {
      key: '9',
      label: t('reviews'),
      children: <Link href={`${routes.moderationOfReview}?showAccepted=true&userId=${id}`}>{user?.gradeCount}</Link>,
    },
    {
      key: '10',
      label: t('messages'),
      children: <Link href={`${routes.messageReport}?userId=${id}`}>{user?.messageCount}</Link>,
    },
    {
      key: '11',
      label: t('cart'),
      children: <Link href={`${routes.cartReport}?userId=${id}`}>{user?.cartCount}</Link>,
    },
  ];

  const favorites = [
    {
      key: '1',
      label: t('favorites'),
      children: (
        <div className="d-flex flex-column gap-3 gap-xl-5 col-12">
          {chunk(user?.favorites || [], 4).map((chunkedFavorites, i) => <div key={i} className={cn('d-flex', { 'flex-column gap-3': isMobile })}>{chunkedFavorites.map((value, j) => (
            <div key={j} className="d-flex gap-2-5 gap-xl-4 font-oswald col-12 col-xl-3">
              <ImageHover
                height={height}
                width={width}
                deleted={!!value.deleted}
                images={value.images ?? []}
                className={cn({ 'opacity-50': value.deleted })}
              />
              <div className="d-flex flex-column justify-content-between font-oswald fs-5-5">
                <Link href={getHref(value)} className={cn('d-flex flex-column gap-3', { 'opacity-50': value.deleted })}>
                  <span className="lh-1">{value.name}</span>
                  <span>{tPrice('price', { price: value.price - value.discountPrice })}</span>
                </Link>
              </div>
            </div>
          ))}</div>)}
        </div>
      ),
    },
  ];

  const fetchUser = async (params: ParamsIdInterface) => {
    try {
      setIsSubmit(true);
      const { data: { user: fetchedUser, code } } = await axios.get<{ code: number; user: UserCardInterface; }>(routes.getUserCard(params.id));
      if (code === 1) {
        setUser(fetchedUser);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (axiosAuth) {
      fetchUser({ id });
    }
  }, [axiosAuth]);

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title', { username: user?.name })} description={t('description', { username: user?.name })} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title', { username: user?.name })}</h1>
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3 mb-xl-5">
        <BackButton style={{}} />
      </div>
      <div className="d-flex flex-column gap-4">
        <Descriptions layout={isMobile ? 'vertical' : 'horizontal'} items={items} />
        <Descriptions layout="vertical" items={favorites} />
      </div>
    </div>
  ) : null;
};

export default User;
