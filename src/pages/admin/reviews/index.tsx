import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Popconfirm, Checkbox, List, Divider } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { UploadFile } from 'antd/lib';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { setPaginationParams, type CommentResponseInterface, type GradeResponseInterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NotFoundContent } from '@/components/NotFoundContent';
import { PreviewImage } from '@/components/PreviewImage';
import { GradeListTitle, GradeListDescription, GradeListReplyForm } from '@/components/GradeList';
import { toast } from '@/utilities/toast';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';
import { MobileContext, SubmitContext } from '@/components/Context';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';
import type { ReplyComment } from '@/types/app/comment/ReplyComment';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';


const Reviews = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reviews' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');
  const showAcceptedParams = urlParams.get('showAccepted');

  const { setIsSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const replyComment: Partial<ReplyComment> = {
    parentComment: undefined,
    text: undefined,
    images: undefined,
  };

  const coefficient = 1.3;

  const width = 115;
  const height = width * coefficient;

  const { axiosAuth, pagination } = useAppSelector((state) => state.app);
  const { role } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState<boolean>(false);
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
      const { data: result } = await axios.delete<GradeResponseInterface>(routes.removeGrade(gradeId));
      handleUpdate(result);
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const onGradeRestore = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await axios.get<GradeResponseInterface>(routes.restoreGrade(gradeId));
      handleUpdate(result);
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  const onGradeAccept = async (gradeId: number) => {
    try {
      setIsLoading(true);
      const { data: result } = await axios.get<GradeResponseInterface>(routes.acceptGrade(gradeId));
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
      const { data: result } = await axios.post<CommentResponseInterface>(routes.createComment, { ...reply, ...values });
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
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.getUnchekedGrades, {
        params,
      });
      if (code === 1) {
        dispatch(setPaginationParams(paginationParams));
        setData(replacement ? items : (state) => [...state, ...items]);
      }
      setIsLoading(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsLoading);
    }
  };

  useEffect(() => {
    if ((withDeleted !== undefined || showAccepted !== undefined) && axiosAuth) {
      router.push({
        query: { 
          ...router.query, 
          ...(withDeleted !== undefined ? { withDeleted } : {}), 
          ...(showAccepted !== undefined ? { showAccepted } : {}),
        },
      },
      undefined,
      { shallow: true });

      const params: FetchGradeInterface = {
        limit: pagination.limit || 10,
        offset: 0,
        withDeleted,
        showAccepted,
      };
      fetchGrades(params, true);
    }
  }, [withDeleted, showAccepted, axiosAuth]);

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-good-vibes-pro text-center mb-5" style={{ marginTop: isMobile ? '30%' : '12%' }}>{t('title', { count: pagination.count })}</h1>
      <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
      <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3 mb-3 mb-xl-5">
        <BackButton style={{}} />
        <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
        <Checkbox checked={showAccepted} onChange={showAcceptedHandler}>{t('showAccepted')}</Checkbox>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchGrades({ limit: pagination.limit, offset: pagination.offset + 10, withDeleted, showAccepted })}
        hasMore={data.length < pagination.count}
        loader
        endMessage={data.length ? <Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider> : null}
        style={{ overflow: 'unset' }}
      >
        <List
          dataSource={data}
          locale={{
            emptyText: <NotFoundContent text={t('reviewsNotExist')} />,
          }}
          loading={isLoading}
          renderItem={(value, i) => (
            <div className="d-flex flex-column flex-xl-row align-items-center justify-content-between mb-2" style={i !== data.length - 1 ? { borderBlockEnd: '1px solid rgba(5, 5, 5, 0.06)' } : {}}>
              <div className="d-flex flex-column flex-xl-row align-items-center gap-4 w-100 py-2">
                <ImageHover className="align-self-start" href={getHref(value?.item)} images={value?.item?.images} height={height} width={width} />
                <List.Item
                  className="d-flex flex-column w-100 p-0"
                  classNames={{ actions: 'ms-0 align-self-start' }}
                  style={{ minHeight: height }}
                  actions={[...(value?.comment
                    ? [
                      reply.parentComment && value.comment?.id === reply.parentComment.id
                        ? <a key="cancel" title={t('cancel')} onClick={clearReplyComment}>{t('cancel')}</a>
                        : <a key="reply" title={t('reply')} onClick={() => value.comment?.id
                          ? replyCommentInit(value.comment.id)
                          : {}}>{t('reply')}</a>,
                    ]
                    : []),
                  ...[(value.deleted
                    ? <a key="restore" title={t('restore')} onClick={() => onGradeRestore(value.id)}>{t('restore')}</a>
                    : <Popconfirm key="decline" title={t('declineTitle')} description={t('declineDescription')} okText={t('decline')} cancelText={t('cancel')} onConfirm={() => onGradeRemove(value.id)}>
                      <a>{t('decline')}</a>
                    </Popconfirm>)]]}
                >
                  <List.Item.Meta
                    className="w-100 mb-4"
                    title={<GradeListTitle grade={value} withTags withLinkToOrder />}
                    description={<GradeListDescription grade={value} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} setIsSubmit={setIsSubmit} />}
                  />
                  {reply.parentComment && value.comment?.id === reply.parentComment.id ? (
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
                  ) : null}
                </List.Item>
              </div>
              {value.deleted || value.checked ? null : <Button className="button border-button py-2 fs-6 my-3 my-xl-0" title={t('accept')} onClick={() => onGradeAccept(value.id)}>{t('accept')}</Button>}
            </div>
          )}
        />
      </InfiniteScroll>
    </div>
  ) : null;
};

export default Reviews;
