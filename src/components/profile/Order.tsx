import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Form, Input, Rate, Tag, type UploadFile } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useContext, useEffect, useRef, useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import moment from 'moment';
import cn from 'classnames';
import Link from 'next/link';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { createGrade, selectors } from '@/slices/orderSlice';
import { routes } from '@/routes';
import { MobileContext } from '@/components/Context';
import { ImageHover } from '@/components/ImageHover';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getOrderDiscount, getOrderPrice, getPositionsPrice } from '@/utilities/order/getOrderPrice';
import { Spinner } from '@/components/Spinner';
import { UploadImage } from '@/components/UploadImage';
import { newGradeValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { getHref } from '@/utilities/getHref';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { getRussianPostRussianPostTranslate } from '@/utilities/order/getRussianPostTypeTranslate';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import type { GradeFormInterface } from '@/types/order/Grade';
import type { ItemInterface } from '@/types/item/Item';
import type { OrderInterface } from '@/types/order/Order';

export const Order = ({ orderId, order: orderParams }: { orderId: number; order?: OrderInterface }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const inputRef = useRef<HTMLTextAreaElement>(null);

  const router = useRouter();

  const dispatch = useAppDispatch();

  const { isMobile } = useContext(MobileContext);
  
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
  const [isAnimating, setIsAnimating] = useState<number>();
  
  const [form] = Form.useForm();

  const { lang, isAdmin } = useAppSelector((state) => state.user);
  const { loadingStatus } = useAppSelector((state) => state.order);

  const order = useAppSelector((state) => orderParams || selectors.selectById(state, orderId));

  const coefficient = 1.3;

  const width = 77;
  const height = width * coefficient;

  const gradeFormInit = (positionId: number) => setGrade({ ...newGrade, position: { id: positionId } });

  const handlePhoneCopy = (id: number) => {
    setIsAnimating(id);
    setTimeout(() => setIsAnimating(undefined), 1000);
  };

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
      if (typeof inputRef.current.scrollIntoView === 'function') {
        inputRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start',
        });
      }
      inputRef.current.focus();
    }
  }, [grade.position]);

  return order
    ? (
      <div className="d-flex flex-column gap-4 without-padding" style={{ ...(isMobile || orderParams ? {} : { width: '90%' }) }}>
        <Badge.Ribbon text={tOrders(`statuses.${order.status}`)} color={getOrderStatusColor(order.status)}>
          <Card>
            <div className="d-flex flex-column col-12 gap-5" style={{ ...(isMobile ? {} : { lineHeight: 0.5 }) }}>
              <div className="d-flex flex-column mb-2 mb-xl-0 col-12 col-xl-6 gap-2 gap-xl-5">
                <h3 className="fs-4 fw-bold font-oswald text-muted">{t('orderDate', { number: orderId, date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}</h3>
                {isAdmin && (
                  <div className={cn('d-flex flex-xl-row align-items-xl-center gap-2', { 'position-absolute top-0': !isMobile })}>
                    <Link href={`${routes.userCard}/${order.user.id}`} className="fs-5">{order.user.name}</Link>
                    <CopyToClipboard text={order.user.phone}>
                      <Button type="dashed" style={{ color: 'orange' }} className={cn('d-flex align-items-center fs-5', { 'animate__animated animate__headShake': isAnimating === order.id })} onClick={() => handlePhoneCopy(order.id)}>
                        <CopyOutlined className="fs-5" />{order.user.phone}
                      </Button>
                    </CopyToClipboard>
                  </div>
                )}
              </div>
              <div className="d-flex flex-column flex-xl-row justify-content-between gap-5 gap-xl-0">
                <div className="d-flex flex-column col-12 col-xl-6 gap-1">
                  {order.positions.map((orderPosition) => (
                    <div key={orderPosition.id} className="d-flex flex-column gap-3">
                      <div className="d-flex align-items-center gap-3">
                        <ImageHover
                          height={height}
                          width={width}
                          href={getHref(orderPosition.item)}
                          images={orderPosition.item.images}
                        />
                        <div className="d-flex flex-column justify-content-between fs-6" style={{ height }}>
                          <span className="font-oswald fs-6 lh-1" style={{ fontWeight: 500 }}>{orderPosition.item.translations.find((translation) => translation.lang === lang)?.name}</span>
                          <span className="lh-1">{t('countPrice', { count: orderPosition.count, price: (orderPosition.price - orderPosition.discountPrice) * orderPosition.count })}</span>
                        </div>
                      </div>
                      <div>
                        {!orderParams && !orderPosition.grade && order.status === OrderStatusEnum.COMPLETED
                          ? grade.position && orderPosition.id === grade.position.id
                            ? <Button className="button border-button py-2 fs-6" title={t('cancel')} onClick={clearGradeForm}>{t('cancel')}</Button>
                            : <Button className="button border-button py-2 fs-6" title={t('rateItem')} onClick={() => gradeFormInit(orderPosition.id)}>{t('rateItem')}</Button>
                          : null}
                      </div>
                      {grade.position && orderPosition.id === grade.position.id ? (
                        <Form name="createGrade" initialValues={grade} className="d-flex flex-column align-self-start my-4 w-100 border p-4" style={{ borderRadius: '7px' }} onFinish={onFinish} form={form}>
                          <Form.Item<GradeFormInterface> id="grade" name="grade" className="mb-4 large-input" rules={[newGradeValidation]}>
                            <div className="d-flex flex-column flex-xl-row align-items-start align-items-xl-center gap-3">
                              <label htmlFor="grade" className="font-oswald text-muted fs-5">{t('rate')}</label>
                              <Rate value={grade.grade} onChange={setRate} />
                            </div>
                          </Form.Item>
                          <Form.Item<GradeFormInterface> name={['comment', 'text']} className="mb-4 large-input" rules={[newGradeValidation]}>
                            <Input.TextArea ref={inputRef} variant="borderless" size="large" placeholder={t('enterComment')} rows={2} />
                          </Form.Item>
                          <div className="d-flex flex-column flex-xl-row gap-3 gap-xl-0 flex-column-reverse justify-content-between align-items-center">
                            <Button className="button border-button py-2 fs-6" title={t('rateSubmit')} htmlType="submit">{t('rateSubmit')}</Button>
                            <UploadImage crop preview filelist={fileList} setFileList={setFileList} previewImage={previewImage} previewOpen={previewOpen} setCommentImages={setCommentImages} setPreviewImage={setPreviewImage} setPreviewOpen={setPreviewOpen} />
                          </div>
                        </Form>
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="d-flex flex-column col-12 col-xl-6 gap-5">
                  {order.comment && (
                    <div className="d-flex flex-column gap-4">
                      <span className="fs-4 fw-bold font-oswald">{t('orderInfo')}</span>
                      <Tag color="#eaeef6" className="fs-6 text-wrap" style={{ padding: '5px 10px', color: '#393644' }}>
                        <p className="fs-6 fw-bold font-oswald">{t('orderComment')}</p>
                        <p className="font-oswald">{order.comment}</p>
                      </Tag>
                    </div>
                  )}
                  <div className="d-flex flex-column gap-4 fs-6 font-oswald lh-1">
                    <div className="d-flex justify-content-between">
                      <span>{tCart('deliveryType')}</span>
                      <span className="fw-bold">{getDeliveryTypeTranslate(order.delivery.type, lang as UserLangEnum)}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="col-5">{t('deliveryAddress')}</span>
                      <span className="text-end fw-bold col-7 text-wrap">{order.delivery.address}</span>
                    </div>
                    {order.delivery.index && (
                      <div className="d-flex justify-content-between">
                        <span>{t('mailIndex')}</span>
                        <span className="fw-bold">{order.delivery.index}</span>
                      </div>
                    )}
                    {order.delivery.mailType && (
                      <div className="d-flex justify-content-between">
                        <span>{t('deliveryType')}</span>
                        <span className="fw-bold">{getRussianPostRussianPostTranslate(order.delivery.mailType, lang as UserLangEnum)}</span>
                      </div>
                    )}
                    <div className="d-flex justify-content-between">
                      <span>{t('deliveryAmount')}</span>
                      <span className="fw-bold">{order.deliveryPrice ? tOrders('price', { price: order.deliveryPrice }) : tCart('free')}</span>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>{t('itemsAmount')}</span>
                      <span className="fw-bold">{tOrders('price', { price: getPositionsPrice(order.positions, 0, true) })}</span>
                    </div>
                    {order.positions.some((position) => position.discountPrice) && (
                      <div className="d-flex justify-content-between">
                        <span>{t('discount')}</span>
                        <span className="fw-bold text-danger">{`- ${tOrders('price', { price: order.positions.reduce((acc, { discountPrice }) => acc + discountPrice, 0) })}`}</span>
                      </div>
                    )}
                    {order.promotional && (
                      <div className="d-flex justify-content-between">
                        <span>{tOrders('promotional')}</span>
                        <span className="fw-bold text-danger">{`- ${tOrders('price', { price: getOrderDiscount(order) })}`}</span>
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between fs-5 font-oswald fw-bold">
                    <span>{tCart('total')}</span>
                    <span className="fw-bold">{tOrders('price', { price: getOrderPrice(order) })}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Badge.Ribbon>
      </div>
    )
    : <Spinner isLoaded={isLoaded} />;
};
