import { useTranslation } from 'react-i18next';
import { Button, Form, Input, List, Rate, Popconfirm, Tag } from 'antd';
import { useContext, useEffect, useRef, useState } from 'react';
import { Reply } from 'react-bootstrap-icons';
import moment from 'moment';
import Image from 'next/image';
import Link from 'next/link';
import type { FormInstance, UploadFile } from 'antd/lib';

import { getItemGrades, createComment, removeGrade, setPaginationParams, type CommentResponseInterface, type GradeResponseInterface } from '@/slices/appSlice';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { newCommentValidation } from '@/validations/validations';
import { PreviewImage } from '@/components/PreviewImage';
import { UploadImage, urlToBase64, getBase64 } from '@/components/UploadImage';
import { NotFoundContent } from '@/components/NotFoundContent';
import { SubmitContext } from '@/components/Context';
import { routes } from '@/routes';
import type { ReplyComment } from '@/types/app/comment/ReplyComment';
import type { PaginationEntityInterface, PaginationSearchInterface } from '@/types/PaginationInterface';
import type { ItemInterface } from '@/types/item/Item';
import type { ItemGradeEntity } from '@server/db/entities/item.grade.entity';

interface GradeListTitleInterface {
  grade: ItemGradeEntity;
  withTags?: boolean;
  withLinkToOrder?: boolean;
}

interface GradeListDescriptionInterface {
  grade: ItemGradeEntity;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
  setIsSubmit: React.Dispatch<React.SetStateAction<boolean>>;
}

interface GradeListReplyFormInterface {
  reply: Partial<ReplyComment>;
  onFinish: (values: ReplyComment) => Promise<void>;
  form: FormInstance<any>;
  fileList: UploadFile[];
  setFileList: React.Dispatch<React.SetStateAction<UploadFile[]>>;
  setCommentImages: React.Dispatch<React.SetStateAction<ItemInterface['images']>>;
  setPreviewOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPreviewImage: React.Dispatch<React.SetStateAction<string>>;
}

export const GradeListTitle = ({ grade, withTags, withLinkToOrder }: GradeListTitleInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.gradeList.tags' });

  return (
    <div className="d-flex flex-column gap-3 mb-3">
      <div className="d-flex flex-column flex-xl-row align-items-xl-center gap-3">
        <div className="d-flex gap-3">
          <Rate disabled allowHalf value={grade.grade} />
          {withLinkToOrder
            ? <Link href={`${routes.page.admin.allOrders}/${grade.position.order.id}`}>{grade.user.name}</Link>
            : <span>{grade.user.name}</span>}
        </div>
        <div>
          {withTags
            ? grade.deleted ? <Tag color="volcano">{t('deleted')}</Tag> : grade.checked ? <Tag color="cyan">{t('accepted')}</Tag> : null
            : null}
        </div>
      </div>
      <span className="text-muted">{moment(grade.created).format(DateFormatEnum.DD_MM_YYYY)}</span>
    </div>
  );
};

export const GradeListDescription = ({ grade, setPreviewImage, setPreviewOpen, setIsSubmit }: GradeListDescriptionInterface) => (
  <div className="d-flex flex-column">
    <span className="fs-5-5 font-oswald" style={{ color: 'black' }}>{grade.comment?.text}</span>
    {grade?.comment?.images.length
      ? (
        <div className="d-flex gap-3 mt-3">
          {grade?.comment?.images.map(({ id: imageId, src, name: imageName }) => (
            <div key={imageId}>
              <Image src={src} width={50} height={50} unoptimized alt={imageName} style={{ borderRadius: '7px' }} onClick={() => urlToBase64(src, setPreviewImage, setPreviewOpen, getBase64, setIsSubmit)} className="cursor-pointer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            </div>
          ))}
        </div>
      )
      : null}
    {grade?.comment?.replies?.length ? (
      <div className="d-flex gap-4 mt-4 ms-5">
        <Reply className="fs-4" />
        <div className="d-flex flex-column gap-4">
          {grade.comment.replies.map((comment) => (
            <div key={comment.id} className="d-flex flex-column">
              <span className="fw-bold" style={{ color: 'black' }}>{comment.user.name}</span>
              <span className="mb-3">{moment(comment.created).format(DateFormatEnum.DD_MM_YYYY)}</span>
              <span className="fs-5-5 font-oswald" style={{ color: 'black' }}>{comment.text}</span>
              {comment.images.length
                ? (
                  <div className="d-flex gap-3 mt-3">
                    {comment.images.map(({ id: imageId, src, name: imageName }) => (
                      <div key={imageId}>
                        <Image src={src} width={50} height={50} unoptimized alt={imageName} style={{ borderRadius: '7px' }} onClick={() => urlToBase64(src, setPreviewImage, setPreviewOpen, getBase64, setIsSubmit)} className="cursor-pointer" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                      </div>
                    ))}
                  </div>
                )
                : null}
            </div>
          ))}
        </div>
      </div>
    ) : null}
  </div>
);

export const GradeListReplyForm = ({ reply, onFinish, form, fileList, setFileList, setCommentImages, setPreviewImage, setPreviewOpen }: GradeListReplyFormInterface) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.replyForm' });

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, [reply.parentComment]);

  return (
    <Form name="replyComment" initialValues={reply} className="d-flex flex-column align-self-start mb-4 col-12 col-xl-6" onFinish={onFinish} form={form}>
      <Form.Item<ReplyComment> name="text" className="mb-4 large-input" rules={[newCommentValidation]}>
        <Input.TextArea ref={inputRef} variant="borderless" size="large" placeholder={t('enterComment')} rows={1} />
      </Form.Item>
      <div className="d-flex justify-content-between align-items-center">
        <Button className="button border-button py-2 fs-6" title={t('reply')} htmlType="submit">{t('reply')}</Button>
        <UploadImage crop preview filelist={fileList} setFileList={setFileList} setCommentImages={setCommentImages} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
      </div>
    </Form>
  );
};

export const GradeList = ({ item, setItem }: { item: ItemInterface; setItem: React.Dispatch<React.SetStateAction<ItemInterface>>; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.gradeList' });

  const { isAdmin } = useAppSelector((state) => state.user);
  const { pagination, loadingStatus } = useAppSelector((state) => state.app);

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const replyComment: Partial<ReplyComment> = {
    parentComment: undefined,
    text: undefined,
    images: undefined,
  };

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [commentImages, setCommentImages] = useState<ItemInterface['images']>([]);
  const [reply, setReply] = useState<Partial<ReplyComment>>(replyComment);

  const [form] = Form.useForm();

  const replyCommentInit = (commentId: number) => setReply({ ...replyComment, parentComment: { id: commentId } });

  const clearReplyComment = () => {
    setReply(replyComment);
    setFileList([]);
    setCommentImages([]);
    form.resetFields();
  };

  const onFinish = async (values: ReplyComment) => {
    values.images = commentImages;
    const { payload: { code, comment } } = await dispatch(createComment({ ...reply, ...values })) as { payload: CommentResponseInterface; };
    if (code === 1) {
      setItem((state) => {
        const gradeIndex = state.grades.findIndex((grade) => grade.id === comment.parentComment.grade?.id);
        const stateGrade = state.grades[gradeIndex];
        if (gradeIndex !== -1 && stateGrade?.comment) {
          stateGrade.comment.replies = [...(stateGrade.comment?.replies || []), comment];
        }
        return state;
      });
      clearReplyComment();
    }
  };

  const onGradeRemove = async (gradeId: number) => {
    const { payload } = await dispatch(removeGrade(gradeId)) as { payload: GradeResponseInterface; };
    if (payload.code === 1) {
      setItem({ ...item, grades: item.grades.filter((grade) => grade.id !== payload.grade.id) });
    }
  };

  const onLoadMore = async () => {
    if (loadingStatus !== 'loading' && item && pagination.count > item.grades.length) {
      const params: PaginationSearchInterface = {
        id: item.id,
        limit: pagination.limit,
        offset: pagination.offset + 10,
      };
      const { payload } = await dispatch(getItemGrades(params)) as { payload: PaginationEntityInterface<ItemGradeEntity>; };
      setItem((state) => {
        const grades = payload.items.filter((grade) => !state.grades.some((stateGrade) => stateGrade.id === grade.id));
        state.grades = [...(state.grades || []), ...grades];
        return state;
      });
      dispatch(setPaginationParams(payload.paginationParams));
    }
  };

  const loadMore = item && item?.grades?.length && pagination.count > item?.grades.length ? (
    <Button className="button border-button py-2 fs-6 mt-4" title={t('loadingMore')} onClick={onLoadMore}>{t('loadingMore')}</Button>
  ) : null;

  return (
    <div id="grades" className="d-flex flex-column align-items-start align-items-xl-end">
      <h3 className="col-11 mb-5 text-uppercase">{t('reviews')}</h3>
      <PreviewImage previewImage={previewImage} previewOpen={previewOpen} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
      <List
        className="col-11"
        itemLayout="horizontal"
        loadMore={loadMore}
        loading={loadingStatus === 'loading'}
        dataSource={item?.grades}
        locale={{
          emptyText: <NotFoundContent text={t('reviewsNotExist')} />,
        }}
        renderItem={(value) => (
          <List.Item
            className="d-flex flex-column"
            classNames={{ actions: 'ms-0 align-self-start' }}
            actions={isAdmin
              ? [...(value?.comment
                ? [
                  reply.parentComment && value.comment?.id === reply.parentComment.id
                    ? <a key="cancel" title={t('cancel')} onClick={clearReplyComment}>{t('cancel')}</a>
                    : <a key="reply" title={t('reply')} onClick={() => value.comment?.id
                      ? replyCommentInit(value.comment.id)
                      : {}}>{t('reply')}</a>,
                ]
                : []),
              <Popconfirm key="remove" rootClassName="ant-input-group-addon" title={t('removeTitle')} description={t('removeDescription')} okText={t('remove')} cancelText={t('cancel')} onConfirm={() => onGradeRemove(value.id)}>
                <a>{t('remove')}</a>
              </Popconfirm>]
              : undefined}
          >
            <List.Item.Meta
              className="w-100 mb-5"
              title={<GradeListTitle grade={value} />}
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
        )}
      />
    </div>
  );
};
