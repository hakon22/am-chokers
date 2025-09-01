import { useTranslation } from 'react-i18next';
import axios from 'axios';
import cn from 'classnames';
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd';
import { isEmpty } from 'lodash';
import type { TFunction } from 'i18next';

import { MaskedInput } from '@/components/forms/MaskedInput';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { routes } from '@/routes';
import { toast } from '@/utilities/toast';
import { fetchConfirmCode, removeTelegramId, userProfileUpdate } from '@/slices/userSlice';
import { profileValidation } from '@/validations/validations';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import type { UserProfileType } from '@/types/user/User';

const TelegramButton = ({ telegramId, t, telegramHandler }: { telegramId?: string | null; t: TFunction, telegramHandler: () => void; }) => (
  <div className="text-center">
    <Button type="link" className={cn('mb-2 fs-5 px-3 py-3-5', { 'text-danger mt-2': telegramId })} style={{ backgroundColor: 'white' }} onClick={telegramHandler}>
      {t(telegramId ? 'unlinkTelegram' : 'linkTelegram')}
    </Button>
    <p className={cn('lh-sm', { 'text-danger': telegramId, 'text-muted': !telegramId })}>{t(telegramId ? 'unlinkDescription' : 'linkDescription')}</p>
  </div>
);

export const Personal = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.personal' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { telegramId, key, name, phone } = useAppSelector((state) => state.user);

  const [updateValues, setUpdateValues] = useState<UserProfileType>();
  const [phoneConfirm, setPhoneConfirm] = useState<string>();
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { setIsSubmit } = useContext(SubmitContext);

  const [form] = Form.useForm();

  const initialValues: UserProfileType = {
    name,
    phone,
    password: '',
    confirmPassword: '',
    oldPassword: '',
  };

  const updateProfile = async (changedValues: UserProfileType) => {
    try {
      setIsSubmit(true);
      const { data } = await axios.post(routes.changeUserProfile, { ...changedValues, key }) as { data: { code: number } };
      if (data.code === 1) {
        setUpdateValues(undefined);
        setPhoneConfirm(undefined);
        setIsConfirmed(false);
        form.setFieldsValue({ confirmPassword: '', oldPassword: '', password: '' });
        dispatch(userProfileUpdate(changedValues));
        toast(tToast('changeProfileSuccess'), 'success');
      }
      if (data.code === 2) {
        form.setFields([{ name: 'oldPassword', errors: [tValidation('incorrectPassword')] }]);
      }
      if (data.code === 6) {
        form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const telegramHandler = async () => {
    try {
      if (telegramId) {
        setIsSubmit(true);
        const { data } = await axios.get(routes.unlinkTelegram) as { data: { code: number } };
        if (data.code === 1) {
          dispatch(removeTelegramId());
          toast(tToast('unlinkTelegramSuccess'), 'success');
        }
        setIsSubmit(false);
      } else {
        router.push('https://t.me/AM_CHOKERS_BOT');
      }
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const onFinish = async (values: UserProfileType) => {
    setIsSubmit(true);

    const changedValues = Object.keys(values).reduce((acc, keyObj) => {
      if (initialValues[keyObj] === values[keyObj]) {
        return acc;
      }
      return { ...acc, [keyObj]: values[keyObj] };
    }, {} as UserProfileType);

    if (isEmpty(changedValues)) { // если ничего не изменилось, отменяем изменение
      setIsSubmit(false);
      return;
    }
    setUpdateValues(changedValues);
    if (changedValues.phone && !phoneConfirm) {
      const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: changedValues.phone, key })) as { payload: { code: number } };
      if (code === 1) {
        setPhoneConfirm(changedValues.phone);
      }
      if (code === 4) {
        toast(tToast('timeNotOverForSms'), 'error');
      }
      if (code === 5) {
        form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
      }
    } else {
      await updateProfile(changedValues);
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (isConfirmed && updateValues) {
      updateProfile(updateValues);
    }
  }, [isConfirmed]);

  const password = Form.useWatch('password', form);

  return phoneConfirm && !isConfirmed ? <ConfirmPhone setState={setIsConfirmed} newPhone={phoneConfirm} /> : (
    <Form name="user-profile" autoComplete="off" form={form} initialValues={initialValues} className="col-12 col-xl-8" onFinish={onFinish}>
      {!telegramId && <TelegramButton telegramId={telegramId} t={t} telegramHandler={telegramHandler} />}
      <label htmlFor="user-profile_phone" className="label">{t('phone')}</label>
      <Form.Item<UserProfileType> name="phone" rules={[profileValidation]} className="mb-3">
        <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
      </Form.Item>
      <label htmlFor="user-profile_name" className="label">{t('name')}</label>
      <Form.Item<UserProfileType> name="name" rules={[profileValidation]} className="mb-3">
        <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} />
      </Form.Item>
      <label htmlFor="user-profile_password" className="label">{t('password')}</label>
      <Form.Item<UserProfileType> name="password" rules={[profileValidation]} className="mb-3">
        <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder="••••••" />
      </Form.Item>
      {password && (
        <>
          <label htmlFor="user-profile_confirmPassword" className="label">{t('confirmPassword')}</label>
          <Form.Item<UserProfileType>
            name="confirmPassword"
            rules={[
              profileValidation,
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(tValidation('mastMatch')));
                },
              }),
            ]}
            className="mb-3"
            required
          >
            <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('confirmPassword')} />
          </Form.Item>
          <label htmlFor="user-profile_oldPassword" className="label">{t('oldPassword')}</label>
          <Form.Item<UserProfileType> name="oldPassword" rules={[profileValidation]} className="mb-3" required>
            <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('oldPassword')} />
          </Form.Item>
        </>
      )}
      {telegramId && <TelegramButton telegramId={telegramId} t={t} telegramHandler={telegramHandler} />}
      <div className="mt-5 d-flex justify-content-center mx-auto">
        <Button type="primary" htmlType="submit" className="button px-4">
          {t('submitButton')}
        </Button>
      </div>
    </Form>
  );
};
