import { useEffect, useState, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, DatePicker, Form, Input, Modal } from 'antd';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import moment, { type Moment } from 'moment';

import { TimePicker } from '@/components/TimePicker';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { locale } from '@/locales/pickers.locale.ru';
import { publishTelegramValidation } from '@/validations/validations';
import styles from '@/components/item-admin/ItemAdminPublishModal.module.scss';
import type { PublishTelegramInterface } from '@/slices/appSlice';
import type { ItemAdminPublishModalProps, PublicationDateFormInterface } from '@/components/item-admin/itemAdmin.types';

const MomentDatePicker = DatePicker.generatePicker<Moment>(momentGenerateConfig);

export const ItemAdminPublishModal = ({
  publishData,
  isTgPublish,
  publicationDate,
  setPublicationDate,
  onPublicationDateUpdate,
  setIsTgPublish,
  onPublish,
  generateDescription,
  lang,
  uiVariant = 'default',
}: ItemAdminPublishModalProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const [form] = Form.useForm<PublishTelegramInterface>();
  const [publicationDateForm] = Form.useForm<PublicationDateFormInterface>();

  const date = Form.useWatch('date', form);
  const publicationDateValue = Form.useWatch('publicationDate', publicationDateForm);

  const [time, setTime] = useState<string | null>(null);
  const [publicationTime, setPublicationTime] = useState<string | null>(null);

  const setPublicationTimeEffect = useEffectEvent(setPublicationTime);
  const setTimeEffect = useEffectEvent(setTime);

  const isV2 = uiVariant === 'v2';

  const onTgFinish = () => {
    form.validateFields().then((values) => {
      if ([date, time].filter(Boolean).length === 1) {
        const name = date ? 'time' : 'date';
        form.setFields([{ name, errors: [tValidation('required')] }]);
      } else {
        values.time = time;
        onPublish(values);
      }
    });
  };

  const onPublicationDateFinish = () => {
    const values = publicationDateForm.getFieldsValue();
    if ([publicationDateValue, publicationTime].filter(Boolean).length === 1) {
      const name: keyof PublicationDateFormInterface = publicationDateValue ? 'publicationTime' : 'publicationDate';
      publicationDateForm.setFields([{ name, errors: [tValidation('required')] }]);
    } else {
      values.publicationTime = publicationTime;
      onPublicationDateUpdate(values);
    }
  };

  const handleTgCancel = () => {
    form.resetFields();
    setTime(null);
    setIsTgPublish(false);
  };

  const handlePublicationDateCancel = () => {
    publicationDateForm.resetFields();
    setPublicationTime(null);
    setPublicationDate(null);
  };

  useEffect(() => {
    if (isTgPublish) {
      setTimeEffect(publishData.time ? moment(publishData.time).format(DateFormatEnum.HH_MM) : null);
      form.resetFields();
      form.setFieldsValue(publishData);
    } else {
      form.resetFields();
      setTimeEffect(null);
    }
  }, [isTgPublish, publishData]);

  useEffect(() => {
    if (publicationDate) {
      setPublicationTimeEffect(publicationDate ? moment(publicationDate).format(DateFormatEnum.HH_MM) : null);
      publicationDateForm.resetFields();
      publicationDateForm.setFieldsValue({
        publicationDate,
        publicationTime: moment(publicationDate).format(DateFormatEnum.HH_MM),
      });
    } else {
      publicationDateForm.resetFields();
      setPublicationTimeEffect(null);
    }
  }, [publicationDate]);

  useEffect(() => {
    form.setFieldValue('description', publishData.description);
  }, [publishData.description]);

  const tgFooterV2 = (
    <div className={styles.v2Footer}>
      <div className={styles.v2FooterMain}>
        <Button className={styles.v2BtnGenerate} onClick={generateDescription}>
          {t('generateDescription')}
        </Button>
        <div className={styles.v2FooterActions}>
          <Button className={styles.v2BtnCancel} onClick={handleTgCancel}>
            {t('cancel')}
          </Button>
          <Button className={styles.v2BtnOk} type="primary" onClick={onTgFinish}>
            {t(date && time ? 'publishToTelegramLater' : 'publishToTelegramNow')}
          </Button>
        </div>
      </div>
    </div>
  );

  const siteScheduleFooterV2 = (
    <div className={styles.v2Footer}>
      <div className={`${styles.v2FooterActions} ${styles.v2FooterActionsEnd}`}>
        <Button className={styles.v2BtnCancel} onClick={handlePublicationDateCancel}>
          {t('cancel')}
        </Button>
        <Button
          className={styles.v2BtnOk}
          type="primary"
          disabled={[publicationDateValue, publicationTime].filter(Boolean).length !== 2}
          onClick={onPublicationDateFinish}
        >
          {t('publishUpdate')}
        </Button>
      </div>
    </div>
  );

  return isTgPublish
    ? (
      <Modal
        title={t('publishTitle')}
        centered
        zIndex={10000}
        width={isV2 ? 520 : undefined}
        rootClassName={isV2 ? styles.v2Modal : undefined}
        classNames={isV2 ? undefined : { header: 'text-center', footer: 'ant-input-group-addon' }}
        open={isTgPublish}
        onOk={isV2 ? undefined : onTgFinish}
        okText={isV2 ? undefined : t(date && time ? 'publishToTelegramLater' : 'publishToTelegramNow')}
        cancelText={isV2 ? undefined : t('cancel')}
        onCancel={handleTgCancel}
        footer={isV2
          ? tgFooterV2
          : (_, { OkBtn, CancelBtn }) => (
            <div className="d-flex flex-column flex-xl-row justify-content-end gap-2 mt-4">
              {isTgPublish ? <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={generateDescription}>{t('generateDescription')}</Button> : null}
              <CancelBtn />
              <OkBtn />
            </div>
          )}
      >
        {isV2
          ? (
            <Form form={form} layout="vertical" className={styles.v2Form}>
              <div className={styles.v2DateTimeRow}>
                <Form.Item<PublishTelegramInterface>
                  className={styles.v2Field}
                  label={t('placeholderDate')}
                  name="date"
                  getValueProps={(value) => ({ value: value ? moment(value) : value })}
                  rules={[publishTelegramValidation]}
                >
                  <MomentDatePicker
                    minDate={moment()}
                    placeholder={t('placeholderDate')}
                    showNow={false}
                    format={DateFormatEnum.DD_MM_YYYY}
                    locale={lang === UserLangEnum.RU ? locale : undefined}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item<PublishTelegramInterface> className={styles.v2Field} label={t('placeholderTime')} name="time">
                  <TimePicker
                    onChange={(value) => setTime(value)}
                    value={time}
                    minDate={date}
                    placeholder={t('placeholderTime')}
                    step={10}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </div>
              <Form.Item<PublishTelegramInterface> label={t('descriptionSection')} name="description" rules={[publishTelegramValidation]}>
                <Input.TextArea rows={6} placeholder={t('enterDescription')} />
              </Form.Item>
            </Form>
          )
          : (
            <Form form={form} key={1} className="mt-4">
              <div className="d-flex justify-content-around">
                <Form.Item<PublishTelegramInterface> name="date" getValueProps={(value) => ({ value: value ? moment(value) : value })} rules={[publishTelegramValidation]}>
                  <MomentDatePicker minDate={moment()} placeholder={t('placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                </Form.Item>
                <Form.Item<PublishTelegramInterface> name="time">
                  <TimePicker
                    onChange={(value) => setTime(value)}
                    value={time}
                    minDate={date}
                    placeholder={t('placeholderTime')}
                    step={10}
                  />
                </Form.Item>
              </div>
              <Form.Item<PublishTelegramInterface> name="description" rules={[publishTelegramValidation]}>
                <Input.TextArea rows={6} placeholder={t('enterDescription')} />
              </Form.Item>
            </Form>
          )}
      </Modal>
    )
    : (
      <Modal
        title={t('publishSiteTitle')}
        centered
        zIndex={10000}
        width={isV2 ? 520 : undefined}
        rootClassName={isV2 ? styles.v2Modal : undefined}
        classNames={isV2 ? undefined : { header: 'text-center', footer: 'ant-input-group-addon' }}
        open={!!publicationDate}
        onOk={isV2 ? undefined : onPublicationDateFinish}
        okText={isV2 ? undefined : t('publishUpdate')}
        cancelText={isV2 ? undefined : t('cancel')}
        onCancel={handlePublicationDateCancel}
        okButtonProps={isV2
          ? undefined
          : {
            disabled: [publicationDateValue, publicationTime].filter(Boolean).length !== 2,
          }}
        footer={isV2 ? siteScheduleFooterV2 : undefined}
      >
        {isV2
          ? (
            <div className={styles.v2SiteModalBody}>
              <Form form={publicationDateForm} layout="vertical" className={styles.v2Form}>
                <div className={styles.v2DateTimeRow}>
                  <Form.Item<PublicationDateFormInterface> className={styles.v2Field} label={t('placeholderDate')} name="publicationDate" getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                    <MomentDatePicker minDate={moment()} placeholder={t('placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item<PublicationDateFormInterface> className={styles.v2Field} label={t('placeholderTime')} name="publicationTime">
                    <TimePicker
                      onChange={(value) => setPublicationTime(value)}
                      value={publicationTime}
                      minDate={publicationDateValue}
                      placeholder={t('placeholderTime')}
                      step={10}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </div>
              </Form>
            </div>
          )
          : (
            <Form form={publicationDateForm} key={2} className="mt-4">
              <div className="d-flex justify-content-around">
                <Form.Item<PublicationDateFormInterface> name="publicationDate" getValueProps={(value) => ({ value: value ? moment(value) : value })}>
                  <MomentDatePicker minDate={moment()} placeholder={t('placeholderDate')} showNow={false} format={DateFormatEnum.DD_MM_YYYY} locale={lang === UserLangEnum.RU ? locale : undefined} />
                </Form.Item>
                <Form.Item<PublicationDateFormInterface> name="publicationTime">
                  <TimePicker
                    onChange={(value) => setPublicationTime(value)}
                    value={publicationTime}
                    minDate={publicationDateValue}
                    placeholder={t('placeholderTime')}
                    step={10}
                  />
                </Form.Item>
              </div>
            </Form>
          )}
      </Modal>
    );
};
