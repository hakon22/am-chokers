import { useContext, useEffect, useState, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Rate, Skeleton } from 'antd';
import Link from 'next/link';
import InfiniteScroll from 'react-infinite-scroll-component';
import { StarOutlined } from '@ant-design/icons';
import moment from 'moment';
import axios from 'axios';
import cn from 'classnames';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { getHref } from '@/utilities/getHref';
import { routes } from '@/routes';
import { setPaginationParams } from '@/slices/appSlice';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { PreviewImage } from '@/components/PreviewImage';
import { SubmitContext } from '@/components/Context';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import styles from '@/themes/v2/components/profile/V2Reviews.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';
import type { PaginationQueryInterface } from '@server/types/pagination.query.interface';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';

const isVideo = (src: string) => src.endsWith('.mp4');

export const V2Reviews = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.reviews' });

  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);
  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { lang = UserLangEnum.RU } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ItemGradeEntity[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const fetchMyGrades = async (params: PaginationQueryInterface) => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(
        routes.user.getMyGrades, { params },
      );
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData((state) => [...state, ...items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const fetchMyGradesEffect = useEffectEvent(fetchMyGrades);

  useEffect(() => {
    if (axiosAuth) fetchMyGradesEffect({ limit: 10, offset: 0 });
  }, [axiosAuth]);

  if (!data.length && isLoading) {
    return (
      <div className={styles.wrap}>
        <Skeleton active />
      </div>
    );
  }

  if (!data.length && !isLoading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.empty}>
          <StarOutlined />
          <span>{t('reviewsNotExist')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <PreviewImage
        previewImage={previewImage}
        previewOpen={previewOpen}
        setPreviewImage={setPreviewImage}
        setPreviewOpen={setPreviewOpen}
      />

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchMyGrades({ limit: pagination.limit, offset: (pagination.offset ?? 0) + 10 })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length > 5 ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {data.map((grade) => {
          const name = grade.item?.translations.find((translation) => translation.lang === lang)?.name ?? '';
          const cover = grade.item?.images?.[0]?.src ?? '';
          const isAccepted = grade.checked === true;
          const isRejected = grade.deleted !== null && grade.checked === false;

          return (
            <div key={grade.id} className={styles.card}>
              {/* Image */}
              <div className={styles.cardImg}>
                {cover && (isVideo(cover)
                  ? <video src={cover} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <V2Image src={cover} alt={name} fill unoptimized style={{ objectFit: 'cover' }} />
                )}
              </div>

              {/* Body */}
              <div className={styles.cardBody}>
                <span className={styles.cardEyebrow}>
                  {grade.item?.group?.translations?.find((translation) => translation.lang === lang)?.name ?? ''}
                </span>
                <Link href={getHref(grade.item)} className={styles.cardName}>{name}</Link>

                <div className={styles.cardMeta}>
                  <Rate disabled value={grade.grade} style={{ fontSize: 14 }} />
                  <span className={styles.cardDate}>
                    {moment(grade.created).format(DateFormatEnum.DD_MM_YYYY)}
                  </span>
                  {isAccepted && (
                    <span className={cn(styles.statusBadge, styles.accepted)}>Опубликован</span>
                  )}
                  {isRejected && (
                    <span className={cn(styles.statusBadge, styles.rejected)}>Отклонён</span>
                  )}
                  {!isAccepted && !isRejected && (
                    <span className={cn(styles.statusBadge, styles.pending)}>На модерации</span>
                  )}
                </div>

                {grade.comment?.text && (
                  <p className={styles.cardText}>{grade.comment.text}</p>
                )}

                {!!grade.comment?.images?.length && (
                  <div className={styles.cardImages}>
                    {grade.comment.images.map((img, i) => (
                      <div
                        key={i}
                        className={styles.cardThumb}
                        onClick={() => { setPreviewImage(img.src); setPreviewOpen(true); }}
                      >
                        <V2Image src={img.src} alt="" fill unoptimized style={{ objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </InfiniteScroll>
    </div>
  );
};
