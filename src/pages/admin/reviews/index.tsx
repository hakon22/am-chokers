import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useSearchParams } from 'next/navigation';
import { Button, Form, Input, Popconfirm, Checkbox, List, Skeleton, Divider, Rate, Tag } from 'antd';
import axios from 'axios';
import InfiniteScroll from 'react-infinite-scroll-component';
import type { UploadFile } from 'antd/lib';
import moment from 'moment';
import { Reply } from 'react-bootstrap-icons';
import Image from 'next/image';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { newCommentValidation } from '@/validations/validations';
import { setPaginationParams, type CommentResponseInterface, type GradeResponseInterface } from '@/slices/appSlice';
import { routes } from '@/routes';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { booleanSchema } from '@server/utilities/convertation.params';
import { BackButton } from '@/components/BackButton';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { NotFoundContent } from '@/components/forms/NotFoundContent';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { PreviewImage } from '@/components/PreviewImage';
import { getBase64, UploadImage, urlToBase64 } from '@/components/UploadImage';
import type { ItemInterface } from '@/types/item/Item';
import type { PaginationEntityInterface } from '@/types/PaginationInterface';
import type { FetchGradeInterface } from '@/types/app/grades/FetchGradeInterface';
import type { ReplyComment } from '@/types/app/comment/ReplyComment';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';
import { toast } from '@/utilities/toast';


const Reviews = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.reviews' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const urlParams = useSearchParams();
  const withDeletedParams = urlParams.get('withDeleted');

  const replyComment: Partial<ReplyComment> = {
    parentComment: undefined,
    text: undefined,
    images: undefined,
  };

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { pagination } = useAppSelector((state) => state.app);
  const { token, role } = useAppSelector((state) => state.user);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [data, setData] = useState<ItemGradeEntity[]>([]);
  const [withDeleted, setWithDeleted] = useState<boolean | undefined>(booleanSchema.validateSync(withDeletedParams));
  
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

  const fetchGrades = async (params: FetchGradeInterface, replacement = false) => {
    try {
      if (isLoading) {
        return;
      }
      setIsLoading(true);
      const { data: { items, paginationParams, code } } = await axios.get<PaginationEntityInterface<ItemGradeEntity>>(routes.getUnchekedGrades({ isServer: false }), {
        params,
        headers: { Authorization: `Bearer ${token}` },
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
    if (withDeleted !== undefined && data.length) {
      router.push(`?withDeleted=${withDeleted}`, undefined, { shallow: true });

      const params: FetchGradeInterface = {
        limit: pagination.limit || 10,
        offset: 0,
        withDeleted,
      };
      fetchGrades(params, true);
    }
  }, [withDeleted]);

  useEffect(() => {
    if (token && !data.length) {
      const params: FetchGradeInterface = {
        limit: 10,
        offset: 0,
        withDeleted,
      };
      fetchGrades(params);
    }
  }, [token]);

  return role === UserRoleEnum.ADMIN ? (
    <div className="d-flex flex-column mb-5 justify-content-center">
      <Helmet title={t('title', { count: pagination.count })} description={t('description')} />
      <h1 className="font-mr_hamiltoneg text-center fs-1 fw-bold mb-5" style={{ marginTop: '12%' }}>{t('title', { count: pagination.count })}</h1>
      <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
      <div className="d-flex align-items-center gap-3 mb-3">
        <BackButton style={{}} />
        <Checkbox checked={withDeleted} onChange={withDeletedHandler}>{t('withDeleted')}</Checkbox>
      </div>
      <InfiniteScroll
        dataLength={data.length}
        next={() => fetchGrades({ limit: pagination.limit, offset: pagination.offset + 10, withDeleted })}
        hasMore={data.length < pagination.count}
        loader={<Skeleton avatar paragraph={{ rows: 1 }} active />}
        endMessage={<Divider plain className="font-oswald fs-6 mt-5">{t('finish')}</Divider>}
        scrollableTarget="scrollableDiv"
      >
        <List
          dataSource={data}
          locale={{
            emptyText: <NotFoundContent text={t('reviewsNotExist')} />,
          }}
          loading={isLoading}
          renderItem={(value) => (
            <div className="d-flex align-items-center justify-content-between">
              <List.Item
                className="d-flex flex-column w-100"
                classNames={{ actions: 'ms-0 align-self-start' }}
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
                  className="w-100 mb-5"
                  title={
                    <div className="d-flex flex-column gap-2 mb-3">
                      <div className="d-flex align-items-center gap-3">
                        <Rate disabled allowHalf value={value.grade} />
                        <span>{value.user.name}</span>
                        {value.deleted ? <Tag color="volcano">{t('deleted')}</Tag> : value.checked ? <Tag color="cyan">{t('accepted')}</Tag> : null}
                      </div>
                      <span className="text-muted">{moment(value.created).format(DateFormatEnum.DD_MM_YYYY)}</span>
                    </div>
                  }
                  description={value?.comment?.replies?.length
                    ? (
                      <div className="d-flex flex-column">
                        <span className="fs-5-5 font-oswald mb-4" style={{ color: 'black' }}>{value.comment?.text}</span>
                        <div className="d-flex gap-4">
                          <Reply className="ms-5 fs-4" />
                          <div className="d-flex flex-column gap-4">
                            {value.comment.replies.map((comment) => (
                              <div key={comment.id} className="d-flex flex-column">
                                <span className="fw-bold" style={{ color: 'black' }}>{comment.user.name}</span>
                                <span className="mb-3">{moment(comment.created).format(DateFormatEnum.DD_MM_YYYY)}</span>
                                <span className="fs-5-5 font-oswald" style={{ color: 'black' }}>{comment.text}</span>
                                {comment.images.length
                                  ? (
                                    <div className="d-flex gap-3 mt-3">
                                      {comment.images.map(({ id: imageId, src, name: imageName }) => (
                                        <div key={imageId}>
                                          <Image src={src} width={50} height={50} unoptimized alt={imageName} style={{ borderRadius: '7px' }} onClick={() => urlToBase64(src, setPreviewImage, setPreviewOpen, getBase64)} className="cursor-pointer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                        </div>
                                      ))}
                                    </div>
                                  )
                                  : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                    : <span className="fs-5-5 font-oswald" style={{ color: 'black' }}>{value.comment?.text}</span>}
                />
                {reply.parentComment && value.comment?.id === reply.parentComment.id ? (
                  <Form name="replyComment" initialValues={reply} className="d-flex flex-column align-self-start mb-4 w-50" onFinish={onFinish} form={form}>
                    <Form.Item<ReplyComment> name="text" className="mb-4 large-input" rules={[newCommentValidation]}>
                      <Input.TextArea ref={inputRef} variant="borderless" size="large" placeholder={t('enterComment')} rows={1} />
                    </Form.Item>
                    <div className="d-flex justify-content-between align-items-center">
                      <Button className="button border-button py-2 fs-6" title={t('reply')} htmlType="submit">{t('reply')}</Button>
                      <UploadImage preview filelist={fileList} setFileList={setFileList} setCommentImages={setCommentImages} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
                    </div>
                  </Form>
                ) : null}
              </List.Item>
              {value.deleted || value.checked ? null : <Button className="button border-button py-2 fs-6" title={t('accept')} onClick={() => onGradeAccept(value.id)}>{t('accept')}</Button>}
            </div>
          )}
        />
      </InfiniteScroll>
    </div>
  ) : null;
};

export default Reviews;
