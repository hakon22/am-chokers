import { useContext, useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Form, Input, Rate, Tooltip, type UploadFile } from 'antd';
import { ArrowLeftOutlined, CopyOutlined } from '@ant-design/icons';
import Link from 'next/link';
import moment from 'moment';
import cn from 'classnames';
import axios from 'axios';

import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { createGrade, selectors } from '@/slices/orderSlice';
import { routes } from '@/routes';
import { getOrderStatusColor } from '@/utilities/order/getOrderStatusColor';
import { getOrderDiscount, getOrderPrice, getPositionsPrice } from '@/utilities/order/getOrderPrice';
import { Spinner } from '@/components/Spinner';
import { UploadImage } from '@/components/UploadImage';
import { newGradeValidation } from '@/validations/validations';
import { toast } from '@/utilities/toast';
import { getHref } from '@/utilities/getHref';
import { getDeliveryStatusTranslate } from '@/utilities/order/getDeliveryStatusTranslate';
import { getDeliveryTypeTranslate } from '@/utilities/order/getDeliveryTypeTranslate';
import { getRussianPostRussianPostTranslate } from '@/utilities/order/getRussianPostTypeTranslate';
import { scrollTop } from '@/utilities/scrollTop';
import { SubmitContext } from '@/components/Context';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { DeliveryTypeEnum } from '@server/types/delivery/enums/delivery.type.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { OrderStatusEnum } from '@server/types/order/enums/order.status.enum';
import styles from '@/themes/v2/components/profile/V2Order.module.scss';
import { V2Image } from '@/themes/v2/components/V2Image';
import type { GradeFormInterface } from '@/types/order/Grade';
import type { ItemInterface } from '@/types/item/Item';
import type { OrderInterface } from '@/types/order/Order';

const isVideo = (src: string) => src.endsWith('.mp4');

export const V2Order = ({ orderId, order: orderParams }: { orderId: number; order?: OrderInterface }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.orders.order' });
  const { t: tOrders } = useTranslation('translation', { keyPrefix: 'pages.profile.orders' });
  const { t: tCart } = useTranslation('translation', { keyPrefix: 'pages.cart' });
  const { t: tPromo } = useTranslation('translation', { keyPrefix: 'pages.promotionalCodes' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const gradeFormRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setIsSubmit } = useContext(SubmitContext);

  const newGrade: Partial<GradeFormInterface> = { grade: undefined, position: undefined, comment: { text: '', images: [] } };

  const [isLoaded, setIsLoaded] = useState(true);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [commentImages, setCommentImages] = useState<ItemInterface['images']>([]);
  const [grade, setGrade] = useState<Partial<GradeFormInterface>>(newGrade);
  const [isAnimating, setIsAnimating] = useState<number>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  const [form] = Form.useForm();

  const setIsLoadedEffect = useEffectEvent(setIsLoaded);

  const { id: userId, lang = UserLangEnum.RU, isAdmin } = useAppSelector((state) => state.user);
  const { loadingStatus } = useAppSelector((state) => state.order);
  const order = useAppSelector((state) => orderParams || selectors.selectById(state, orderId));

  const handlePhoneCopy = (o: OrderInterface) => {
    setIsAnimating(o.id);
    navigator.clipboard.writeText(o.user.phone);
    setTimeout(() => setIsAnimating(undefined), 1000);
  };

  const clearGradeForm = () => {
    setGrade(newGrade);
    setFileList([]);
    setCommentImages([]);
    form.resetFields();
  };

  const setRate = (rate: number) => {
    setGrade((s) => ({ ...s, grade: rate }));
    form.setFieldValue('grade', rate);
  };

  const onPay = async (id: number) => {
    try {
      setIsSubmit(true);
      const response = await axios.get<{ code: number; url: string }>(routes.order.pay(id));
      if (response.data.code === 1) router.push(response.data.url);
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onFinish = async (values: GradeFormInterface) => {
    const { payload: { code } } = await dispatch(createGrade({
      ...grade,
      comment: { ...grade.comment, ...values.comment, images: commentImages },
    } as GradeFormInterface)) as { payload: { code: number } };
    if (code === 1) {
      clearGradeForm();
      toast(tToast('gradeSendSuccess'), 'success');
      scrollTop();
    }
  };

  useEffect(() => {
    if (gradeFormRef.current) {
      const elementPosition = gradeFormRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - 116, behavior: 'smooth' });
    }
    inputRef.current?.focus();
  }, [grade.position]);

  useEffect(() => {
    if (loadingStatus === 'finish' && !order) {
      router.replace(routes.page.profile.orderHistory);
      setIsLoadedEffect(false);
    } else if (order) {
      setIsLoadedEffect(false);
    }
  }, [order, loadingStatus]);

  if (!order) return <Spinner isLoaded={isLoaded} />;

  const backRoute = orderParams ? routes.page.admin.allOrders : routes.page.profile.orderHistory;

  return (
    <div className={styles.wrap}>
      {/* ── Back ── */}
      <Link href={backRoute} className={styles.backLink}>
        <ArrowLeftOutlined /> {tOrders('title')}
      </Link>

      {/* ── Header card ── */}
      <div className={styles.headerCard}>
        <div className={styles.headerMeta}>
          <h2 className={styles.orderTitle}>
            {t('orderDate', { number: orderId, date: moment(order.created).format(DateFormatEnum.DD_MM_YYYY) })}
          </h2>
          {isAdmin && (
            <div className={styles.adminInfo}>
              <Link href={`${routes.page.admin.userCard}/${order.user.id}`} className={styles.adminLink}>
                {order.user.name}
              </Link>
              <button
                type="button"
                className={cn(styles.phoneCopyBtn, { 'animate__animated animate__headShake': isAnimating === order.id })}
                onClick={() => handlePhoneCopy(order)}
              >
                <CopyOutlined /> {order.user.phone}
              </button>
              {order.user.telegramUsername && (
                <a
                  href={`https://t.me/${order.user.telegramUsername}`}
                  className={cn(styles.phoneCopyBtn, styles.telegramLink)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @{order.user.telegramUsername}
                </a>
              )}
            </div>
          )}
        </div>
        <span className={styles.statusBadge} style={{ background: getOrderStatusColor(order.status) }}>
          {tOrders(`statuses.${order.status}`)}
        </span>
      </div>

      {/* ── Body grid ── */}
      <div className={styles.grid}>
        {/* ── Items card ── */}
        <div className={styles.itemsCard}>
          <h3 className={styles.sectionTitle}>Товары</h3>

          {order.positions.map((position) => {
            const name = position.item.translations.find((translation) => translation.lang === lang)?.name ?? '';
            const cover = position.item.images[0]?.src ?? '';
            const isRating = !orderParams && !position.grade && order.status === OrderStatusEnum.COMPLETED;
            const isGrading = grade.position?.id === position.id;

            return (
              <div key={position.id} className={styles.item}>
                <Link href={getHref(position.item)} className={styles.itemImg}>
                  {cover && (isVideo(cover)
                    ? <video src={cover} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <V2Image src={cover} alt={name} fill unoptimized style={{ objectFit: 'cover' }} />
                  )}
                </Link>

                <div className={styles.itemBody}>
                  <span className={styles.itemEyebrow}>
                    {position.item.group?.translations?.find((translation) => translation.lang === lang)?.name ?? ''}
                  </span>
                  <Link href={getHref(position.item)} className={styles.itemName}>{name}</Link>
                  <span className={styles.itemCountPrice}>
                    {t('countPrice', { count: position.count, price: (position.price - position.discountPrice) * position.count })}
                  </span>

                  {isRating && (
                    <div className={styles.itemActions}>
                      {isGrading
                        ? <button className={styles.btnRate} type="button" onClick={clearGradeForm}>{t('cancel')}</button>
                        : <button className={styles.btnRate} type="button" onClick={() => setGrade({ ...newGrade, position: { id: position.id } })}>{t('rateItem')}</button>
                      }
                    </div>
                  )}

                </div>

                {/* Grade form — spans full card width */}
                {isGrading && (
                  <Form name="createGrade" initialValues={grade} onFinish={onFinish} form={form} className={styles.gradeFormRow}>
                    <div className={styles.gradeForm} ref={gradeFormRef}>
                      <div>
                        <label className={styles.gradeLabel}>{t('rate')}</label>
                        <Form.Item name="grade" rules={[newGradeValidation]} style={{ marginBottom: 0 }}>
                          <Rate value={grade.grade} onChange={setRate} />
                        </Form.Item>
                      </div>
                      <Form.Item name={['comment', 'text']} rules={[newGradeValidation]} style={{ marginBottom: 0 }}>
                        <Input.TextArea
                          ref={inputRef}
                          rows={3}
                          placeholder={t('enterComment')}
                          style={{ borderRadius: 10 }}
                        />
                      </Form.Item>
                      <UploadImage
                        crop
                        preview
                        filelist={fileList}
                        setFileList={setFileList}
                        previewImage={previewImage}
                        previewOpen={previewOpen}
                        setCommentImages={setCommentImages}
                        setPreviewImage={setPreviewImage}
                        setPreviewOpen={setPreviewOpen}
                      />
                      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
                        <button className={styles.gradeSubmit} type="submit">{t('rateSubmit')}</button>
                        <button className={styles.gradeCancel} type="button" onClick={clearGradeForm}>{t('cancel')}</button>
                      </div>
                    </div>
                  </Form>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Info card ── */}
        <div className={styles.infoCard}>
          <h3 className={styles.sectionTitle}>{t('orderInfo')}</h3>

          {order.comment && (
            <div className={styles.commentBlock} style={{ marginBottom: 16 }}>
              <span className={styles.commentLabel}>{t('orderComment')}</span>
              <p className={styles.commentText}>{order.comment}</p>
            </div>
          )}

          <div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{tCart('deliveryType')}</span>
              <span className={styles.infoValue}>{getDeliveryTypeTranslate(order.delivery.type, lang as UserLangEnum)}</span>
            </div>
            {order.delivery.status && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('status')}</span>
                <span className={styles.infoValue}>{getDeliveryStatusTranslate(order.delivery, lang as UserLangEnum)}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('deliveryAddress')}</span>
              <span className={styles.infoValue}>{order.delivery.address}</span>
            </div>
            {order.delivery.index && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('mailIndex')}</span>
                <span className={styles.infoValue}>{order.delivery.index}</span>
              </div>
            )}
            {order.delivery.mailType && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('deliveryType')}</span>
                <span className={styles.infoValue}>{getRussianPostRussianPostTranslate(order.delivery.mailType, lang as UserLangEnum)}</span>
              </div>
            )}
            {order.delivery.type === DeliveryTypeEnum.PICKUP && order.delivery.deliveryDateTime && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{tCart('deliveryDateTime')}</span>
                <span className={styles.infoValue}>{moment(order.delivery.deliveryDateTime).format(DateFormatEnum.DD_MM_YYYY_HH_MM)}</span>
              </div>
            )}
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('deliveryAmount')}</span>
              <span className={styles.infoValue}>
                {order.deliveryPrice ? tOrders('price', { price: order.deliveryPrice }) : tCart('free')}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>{t('itemsAmount')}</span>
              <span className={styles.infoValue}>{tOrders('price', { price: getPositionsPrice(order.positions, 0, true) })}</span>
            </div>
            {order.positions.some((position) => position.discountPrice) && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>{t('discount')}</span>
                <span className={cn(styles.infoValue, styles.infoValueDiscount)}>
                  − {tOrders('price', { price: order.positions.reduce((acc, { discountPrice }) => acc + discountPrice, 0) })}
                </span>
              </div>
            )}
            {order.promotional && (
              <div className={styles.infoRow}>
                <Tooltip title={order.promotional.name} trigger={['click', 'hover']} placement="left" color="#4d689e">
                  <span className={styles.infoLabel}>{tOrders('promotional')}</span>
                </Tooltip>
                <span className={cn(styles.infoValue, styles.infoValueDiscount)}>
                  {order.promotional.freeDelivery && order.promotional.buyTwoGetOne
                    ? `${tPromo('columns.freeDelivery')} · − ${tOrders('price', { price: getOrderDiscount(order) })}`
                    : order.promotional.freeDelivery
                      ? tPromo('columns.freeDelivery')
                      : `− ${tOrders('price', { price: getOrderDiscount(order) })}`}
                </span>
              </div>
            )}
          </div>

          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>{tCart('total')}</span>
            <span className={styles.totalValue}>{tOrders('price', { price: getOrderPrice(order) })}</span>
          </div>

          {order.isPayment
            ? <div className={styles.tagPaid}>{tOrders('payment')}{tOrders('price', { price: getOrderPrice(order) })}</div>
            : order.status !== OrderStatusEnum.CANCELED
              ? (isAdmin && order.user.id !== userId
                ? <div className={styles.tagNotPaid}>{tOrders('notPayment', { price: getOrderPrice(order) })}</div>
                : (
                  <button className={styles.btnPay} type="button" onClick={() => onPay(order.id)}>
                    {t('pay', { price: getOrderPrice(order) })}
                  </button>
                ))
              : null}
        </div>
      </div>
    </div>
  );
};
