import { useContext, useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Form, Popconfirm, Checkbox, Skeleton } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import cn from 'classnames';
import type { UploadFile } from 'antd/lib';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setPaginationParams, type CommentResponseInterface, type GradeResponseInterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { NotFoundContent } from '@/components/NotFoundContent';
import { PreviewImage } from '@/components/PreviewImage';
import { GradeListTitle, GradeListDescription, GradeListReplyForm } from '@/components/GradeList';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { toast } from '@/utilities/toast';
import { SubmitContext } from '@/components/Context';
import styles from '@/themes/v2/components/admin/V2AdminReviews.module.scss';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';
import type { ReplyComment } from '@/types/app/comment/ReplyComment';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';

const coefficient = 1.3;
const width = 115;
const height = width * coefficient;

export const V2AdminReviews = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reviews' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const showAcceptedParams = urlParams.get('showAccepted');
  const userIdParams = urlParams.get('userId');

  const { setIsSubmit } = useContext(SubmitContext);

  const replyComment: Partial<ReplyComment> = {
    parentComment: undefined,
    text: undefined,
    images: undefined,
  };

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { isAdmin } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ItemGradeEntity[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  const [showAccepted, setShowAccepted] = useState<boolean | undefined>(booleanSchema.validateSync(showAcceptedParams));

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [commentImages, setCommentImages] = useState<ItemInterface['images']>([]);
  const [reply, setReply] = useState<Partial<ReplyComment>>(replyComment);

  const [form] = Form.useForm();

  const replyCommentInit = (commentId: number) => setReply({ ...replyComment, parentComment: { id: commentId } });

  const handleUpdate = (result: GradeResponseInterface) => {
    if (result.code === 1) {
      setData((state) => {
        const index = state.findIndex((stateGrade) => stateGrade.id === result.grade.id);
        if (index !== -1) {
          state[index] = result.grade;
        }
        return state;
      });
    }
  };

  const onGradeRemove = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await axios.delete<GradeResponseInterface>(routes.grade.deleteOne(gradeId));
      handleUpdate(result);
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const onGradeRestore = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await axios.get<GradeResponseInterface>(routes.grade.restoreOne(gradeId));
      handleUpdate(result);
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const onGradeAccept = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await axios.get<GradeResponseInterface>(routes.grade.accept(gradeId));
      handleUpdate(result);
      toast(tToast('gradeAcceptSuccess'), 'success');
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const clearReplyComment = () => {
    setReply(replyComment);
    setFileList([]);
    setCommentImages([]);
    form.resetFields();
  };

  const onFinish = async (values: ReplyComment) => {
    try {
      values.images = commentImages;
      setIsLoading(true);
      const { data: result } = await axios.post<CommentResponseInterface>(routes.comment.createOne, { ...reply, ...values });
      if (result.code === 1) {
        clearReplyComment();
        setData((state) => {
          const gradeIndex = state.findIndex((grade) => grade.id === result.comment.parentComment.grade?.id);
          if (gradeIndex !== -1 && state[gradeIndex]?.comment) {
            state[gradeIndex].comment.replies = [...(state[gradeIndex].comment?.replies || []), result.comment];
          }
          return state;
        });
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const withDeletedHandler = () => setWithDeleted(!withDeleted);
  const showAcceptedHandler = () => setShowAccepted(!showAccepted);

  const fetchGrades = async (params: FetchGradeInterface, replacement = false) => {
    try {
      if (isLoading) return;
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.grade.getUnchekedGrades, { params });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData(replacement ? items : (state) => [...state, ...items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const fetchGradesEffect = useEffectEvent(fetchGrades);

  useEffect(() => {
    if ((withDeleted !== undefined || showAccepted !== undefined) && axiosAuth) {
      router.push(
        { query: { ...router.query, ...(withDeleted !== undefined ? { withDeleted } : {}), ...(showAccepted !== undefined ? { showAccepted } : {}) } },
        undefined,
        { shallow: true },
      );
      fetchGradesEffect({ limit: pagination.limit || 10, offset: 0, withDeleted, showAccepted, ...(userIdParams ? { userId: +userIdParams } : {}) }, true);
    }
  }, [withDeleted, showAccepted, userIdParams, axiosAuth]);

  if (!isAdmin) return null;

  return (
    <div className={styles.page}>
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className={styles.pageTitle}>{t('title', { count: pagination.count })}</h1>

      <PreviewImage
        previewImage={previewImage}
        previewOpen={previewOpen}
        setPreviewImage={setPreviewImage}
        setPreviewOpen={setPreviewOpen}
      />

      <div className={styles.controls}>
        <BackButton style={{}} />
        <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        <Checkbox checked={showAccepted} onChange={showAcceptedHandler}>{t('showAccepted')}</Checkbox>
      </div>

      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchGrades({ limit: pagination.limit, offset: (pagination.offset || 0) + 10, withDeleted, showAccepted, ...(userIdParams ? { userId: +userIdParams } : {}) })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton active style={{ marginTop: 16 }} />}
        endMessage={data.length ? <p className={styles.endLine}>{t('finish')}</p> : null}
        style={{ overflow: 'unset' }}
      >
        {!data.length && !isLoading && (
          <NotFoundContent text={t('reviewsNotExist')} style={{ minHeight: height }} />
        )}

        {data.map((value) => (
          <div key={value.id} className={styles.card}>
            <div className={styles.cardImg}>
              <ImageHover href={getHref(value?.item)} images={value?.item?.images} height={height} width={width} />
            </div>

            <div className={styles.cardBody}>
              <GradeListTitle grade={value} withTags withLinkToOrder />
              <GradeListDescription
                grade={value}
                setPreviewImage={setPreviewImage}
                setPreviewOpen={setPreviewOpen}
                setIsSubmit={setIsSubmit}
              />

              {reply.parentComment && value.comment?.id === reply.parentComment.id && (
                <GradeListReplyForm
                  reply={reply}
                  onFinish={onFinish}
                  form={form}
                  fileList={fileList}
                  setFileList={setFileList}
                  setCommentImages={setCommentImages}
                  setPreviewImage={setPreviewImage}
                  setPreviewOpen={setPreviewOpen}
                />
              )}

              <div className={styles.cardActions}>
                <div className={styles.cardLinks}>
                  {value?.comment && (
                    reply.parentComment && value.comment?.id === reply.parentComment.id
                      ? <a className={styles.cardLink} onClick={clearReplyComment}>{t('cancel')}</a>
                      : <a className={styles.cardLink} onClick={() => value.comment?.id ? replyCommentInit(value.comment.id) : {}}>{t('reply')}</a>
                  )}
                  {value.deleted
                    ? <a className={styles.cardLink} onClick={() => onGradeRestore(value.id)}>{t('restore')}</a>
                    : (
                      <Popconfirm
                        title={t('declineTitle')}
                        description={t('declineDescription')}
                        okText={t('decline')}
                        cancelText={t('cancel')}
                        onConfirm={() => onGradeRemove(value.id)}
                      >
                        <a className={cn(styles.cardLink, styles.danger)}>{t('decline')}</a>
                      </Popconfirm>
                    )}
                </div>

                {!value.deleted && !value.checked && (
                  <button type="button" className={styles.btnAccept} onClick={() => onGradeAccept(value.id)}>
                    {t('accept')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
};
