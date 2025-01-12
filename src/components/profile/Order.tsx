import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Form, Input, Rate, Tag } from 'antd';
import { useEffect, useRef, useState } from 'react';
import moment from 'moment';
import type { TFunction } from 'i18next';
import type { UploadFile } from 'antd/lib';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { createGrade, selectors } from '@/slices/orderSlice';
import { routes } from '@/routes';
import { ImageHover } from '@/components/ImageHover';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getOrderDiscount, getOrderPrice } from '@/utilities/order/getOrderPrice';
import { Spinner } from '@/components/Spinner';
import { UploadImage } from '@/components/UploadImage';
import { newGradeValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { getHref } from '@/utilities/getHref';
import type { GradeFormInterface } from '@/types/order/Grade';
import type { ItemInterface } from '@/types/item/Item';
import type { OrderInterface } from '@/types/order/Order';

export const Order = ({ orderId, t, order: orderParams }: { orderId: number; t: TFunction, order?: OrderInterface }) => {
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  const dispatch = useAppDispatch();
  
  const newGrade: Partial<GradeFormInterface> = {
    grade: undefined,
    position: undefined,
    comment: {
      text: '',
      images: [],
    },
  };

  const [isLoaded, setIsLoaded] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [commentImages, setCommentImages] = useState<ItemInterface['images']>([]);
  const [grade, setGrade] = useState<Partial<GradeFormInterface>>(newGrade);
  
  const [form] = Form.useForm();

  const { loadingStatus } = useAppSelector((state) => state.order);
  const order = useAppSelector((state) => selectors.selectById(state, orderId)) || orderParams;

  const height = 100;

  const gradeFormInit = (positionId: number) => setGrade({ ...newGrade, position: { id: positionId } });

  const clearGradeForm = () => {
    setGrade(newGrade);
    setFileList([]);
    setCommentImages([]);
    form.resetFields();
  };

  const setRate = (rate: number) => {
    setGrade((state) => ({ ...state, grade: rate }));
    form.setFieldValue('grade', rate);
  };

  const onFinish = async (values: GradeFormInterface) => {
    const { payload: { code } } = await dispatch(createGrade({ ...grade, comment: { ...grade.comment, ...values.comment, images: commentImages } } as GradeFormInterface)) as { payload: { code: number; } };
    if (code === 1) {
      clearGradeForm();
      toast(tToast('gradeSendSuccess'), 'success');
    }
  };

  useEffect(() => {
    if (loadingStatus === 'finish' && !order) {
      router.replace(routes.orderHistory);
      setIsLoaded(false);
    } else if (order) {
      setIsLoaded(false);
    }
  }, [order, loadingStatus]);

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, [grade.position]);

  return order
    ? (
      <div className="d-flex flex-column gap-4" style={{ width: '90%' }}>
        <Badge.Ribbon text={tOrders(`statuses.${order.status}`)} color={getOrderStatusColor(order.status)}>
          <Card>
            <div className="d-flex col-12" style={{ lineHeight: 0.5 }}>
              <div className="d-flex flex-column justify-content-between col-12">
                <div className="d-flex flex-column font-oswald">
                  <div className="d-flex mb-5 justify-content-between align-items-center">
                    <span className="fs-5 fw-bold">{t('orderDate', { date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}</span>
                    <div className="d-flex flex-column gap-2">
                      {order.promotional
                        ? <Tag color="#e3dcfa" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                          <span>{tOrders('promotional')}</span>
                          <span className="fw-bold">{tOrders('promotionalDiscount', { name: order.promotional.name, discount: getOrderDiscount(order) })}</span>
                        </Tag>
                        : null}
                      <Tag color="#eaeef6" className="fs-6" style={{ padding: '5px 10px', color: '#69788e', width: 'min-content' }}>
                        <span>{tOrders('payment')}</span>
                        <span className="fw-bold">{tOrders('price', { price: getOrderPrice(order) })}</span>
                      </Tag>
                    </div>
                  </div>
                  <div className="d-flex flex-column fs-6 gap-4 mb-5">
                    <span>{t('delivery')}</span>
                    <span>{t('deliveryDate')}</span>
                  </div>
                </div>
                <div className="d-flex flex-column gap-3">
                  {order.positions.map((orderPosition) => (
                    <div key={orderPosition.id} className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-center gap-3" style={{ height }}>
                        <div className="d-flex align-items-center gap-3 h-100">
                          <ImageHover
                            height={height}
                            width={height}
                            href={getHref(orderPosition.item)}
                            images={orderPosition.item.images}
                          />
                          <div className="d-flex flex-column justify-content-between fs-6 h-100">
                            <span className="font-oswald fs-5-5 lh-1" style={{ fontWeight: 500 }}>{orderPosition.item.name}</span>
                            <span className="lh-1">{t('countPrice', { count: orderPosition.count, price: (orderPosition.price - orderPosition.discountPrice) * orderPosition.count })}</span>
                          </div>
                        </div>
                        {!orderParams && !orderPosition.grade
                          ? grade.position && orderPosition.id === grade.position.id
                            ? <Button className="button border-button py-2 fs-6" title={t('cancel')} onClick={clearGradeForm}>{t('cancel')}</Button>
                            : <Button className="button border-button py-2 fs-6" title={t('rateItem')} onClick={() => gradeFormInit(orderPosition.id)}>{t('rateItem')}</Button>
                          : null}
                      </div>
                      {grade.position && orderPosition.id === grade.position.id ? (
                        <Form name="createGrade" initialValues={grade} className="d-flex flex-column align-self-start my-4 w-100 border p-4" style={{ borderRadius: '7px' }} onFinish={onFinish} form={form}>
                          <Form.Item<GradeFormInterface> id="grade" name="grade" className="mb-4 large-input" rules={[newGradeValidation]}>
                            <div className="d-flex align-items-center gap-3">
                              <label htmlFor="grade" className="font-oswald text-muted fs-5">{t('rate')}</label>
                              <Rate value={grade.grade} onChange={setRate} />
                            </div>
                          </Form.Item>
                          <Form.Item<GradeFormInterface> name={['comment', 'text']} className="mb-4 large-input" rules={[newGradeValidation]}>
                            <Input.TextArea ref={inputRef} variant="borderless" size="large" placeholder={t('enterComment')} rows={2} />
                          </Form.Item>
                          <div className="d-flex justify-content-between align-items-center">
                            <Button className="button border-button py-2 fs-6" title={t('rateSubmit')} htmlType="submit">{t('rateSubmit')}</Button>
                            <UploadImage preview filelist={fileList} setFileList={setFileList} previewImage={previewImage} previewOpen={previewOpen} setCommentImages={setCommentImages} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
                          </div>
                        </Form>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </Badge.Ribbon>
      </div>
    )
    : <Spinner isLoaded={isLoaded} />;
};
