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

  return isTgPublish
    ? (
      <Modal
        title={t('publishTitle')}
        centered
        zIndex={10000}
        classNames={{ header: 'text-center', footer: 'ant-input-group-addon' }}
        open={isTgPublish}
        onOk={onTgFinish}
        okText={t(date && time ? 'publishToTelegramLater' : 'publishToTelegramNow')}
        cancelText={t('cancel')}
        onCancel={handleTgCancel}
        footer={(_, { OkBtn, CancelBtn }) => (
          <div className="d-flex flex-column flex-xl-row justify-content-end gap-2 mt-4">
            {isTgPublish ? <Button style={{ background: 'linear-gradient(135deg,#fdd8a6,#f7daed)' }} onClick={generateDescription}>{t('generateDescription')}</Button> : null}
            <CancelBtn />
            <OkBtn />
          </div>
        )}
      >
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
      </Modal>
    )
    : (
      <Modal
        title={t('publishSiteTitle')}
        centered
        zIndex={10000}
        classNames={{ header: 'text-center', footer: 'ant-input-group-addon' }}
        open={!!publicationDate}
        onOk={onPublicationDateFinish}
        okText={t('publishUpdate')}
        cancelText={t('cancel')}
        onCancel={handlePublicationDateCancel}
        okButtonProps={{
          disabled: [publicationDateValue, publicationTime].filter(Boolean).length !== 2,
        }}
      >
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
      </Modal>
    );
};
