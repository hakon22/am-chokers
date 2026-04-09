import { useContext, useEffect, useState, useEffectEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Telegram } from 'react-bootstrap-icons';
import { isEmpty } from 'lodash';
import axios from 'axios';
import cn from 'classnames';

import { MaskedInput } from '@/components/forms/MaskedInput';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { fetchConfirmCode, removeTelegramId, userProfileUpdate } from '@/slices/userSlice';
import { profileValidation } from '@/validations/validations';
import { routes } from '@/routes';
import styles from '@/themes/v2/components/profile/V2Personal.module.scss';
import type { UserProfileType } from '@/types/user/User';

export const V2Personal = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.profile.personal' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const { telegramId, key, name, phone } = useAppSelector((state) => state.user);
  const { setIsSubmit } = useContext(SubmitContext);

  const [updateValues, setUpdateValues] = useState<UserProfileType>();
  const [phoneConfirm, setPhoneConfirm] = useState<string>();
  const [isConfirmed, setIsConfirmed] = useState(false);

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
      const { data } = await axios.post(routes.user.changeUserProfile, { ...changedValues, key }) as { data: { code: number } };
      if (data.code === 1) {
        setUpdateValues(undefined);
        setPhoneConfirm(undefined);
        setIsConfirmed(false);
        form.setFieldsValue({ confirmPassword: '', oldPassword: '', password: '' });
        dispatch(userProfileUpdate(changedValues));
        toast(tToast('changeProfileSuccess'), 'success');
      }
      if (data.code === 2) form.setFields([{ name: 'oldPassword', errors: [tValidation('incorrectPassword')] }]);
      if (data.code === 6) form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  const updateProfileEffect = useEffectEvent(updateProfile);

  const telegramHandler = async () => {
    try {
      if (telegramId) {
        setIsSubmit(true);
        const { data } = await axios.get(routes.user.unlinkTelegram) as { data: { code: number } };
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
    const changedValues = Object.keys(values).reduce((acc, k) => {
      if (initialValues[k] === values[k]) return acc;
      return { ...acc, [k]: values[k] };
    }, {} as UserProfileType);

    if (isEmpty(changedValues)) { setIsSubmit(false); return; }
    setUpdateValues(changedValues);

    if (changedValues.phone && !phoneConfirm) {
      const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: changedValues.phone, key })) as { payload: { code: number } };
      if (code === 1) setPhoneConfirm(changedValues.phone);
      if (code === 4) toast(tToast('timeNotOverForSms'), 'error');
      if (code === 5) form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
    } else {
      await updateProfile(changedValues);
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (isConfirmed && updateValues) updateProfileEffect(updateValues);
  }, [isConfirmed]);

  const password = Form.useWatch('password', form);

  if (phoneConfirm && !isConfirmed) {
    return <ConfirmPhone setState={setIsConfirmed} newPhone={phoneConfirm} />;
  }

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{t('title')}</h2>

      <Form name="user-profile-v2" autoComplete="off" form={form} initialValues={initialValues} onFinish={onFinish}>

        {/* ── Telegram block (top — if not linked) ────────────────── */}
        {!telegramId && (
          <div className={styles.telegramBlock} style={{ marginBottom: 28 }}>
            <button type="button" className={cn(styles.telegramBtn, styles.link)} onClick={telegramHandler}>
              <Telegram size={16} />
              {t('linkTelegram')}
            </button>
            <span className={styles.telegramHint}>{t('linkDescription')}</span>
          </div>
        )}

        {/* ── Fields ──────────────────────────────────────────────── */}
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-profile-v2_phone">{t('phone')}</label>
            <Form.Item<UserProfileType> name="phone" rules={[profileValidation]} style={{ marginBottom: 0 }}>
              <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
            </Form.Item>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-profile-v2_name">{t('name')}</label>
            <Form.Item<UserProfileType> name="name" rules={[profileValidation]} style={{ marginBottom: 0 }}>
              <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} />
            </Form.Item>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="user-profile-v2_password">{t('password')}</label>
            <Form.Item<UserProfileType> name="password" rules={[profileValidation]} style={{ marginBottom: 0 }}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="••••••" />
            </Form.Item>
          </div>

          {password && (
            <>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="user-profile-v2_confirmPassword">{t('confirmPassword')}</label>
                <Form.Item<UserProfileType>
                  name="confirmPassword"
                  rules={[
                    profileValidation,
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('password') === value) return Promise.resolve();
                        return Promise.reject(new Error(tValidation('mastMatch')));
                      },
                    }),
                  ]}
                  style={{ marginBottom: 0 }}
                >
                  <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('confirmPassword')} />
                </Form.Item>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="user-profile-v2_oldPassword">{t('oldPassword')}</label>
                <Form.Item<UserProfileType> name="oldPassword" rules={[profileValidation]} style={{ marginBottom: 0 }}>
                  <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('oldPassword')} />
                </Form.Item>
              </div>
            </>
          )}
        </div>

        {/* ── Telegram block (bottom — if linked) ─────────────────── */}
        {telegramId && (
          <>
            <hr className={styles.divider} />
            <div className={styles.telegramBlock} style={{ marginBottom: 28 }}>
              <button type="button" className={cn(styles.telegramBtn, styles.unlink)} onClick={telegramHandler}>
                {t('unlinkTelegram')}
              </button>
              <span className={cn(styles.telegramHint, styles.danger)}>{t('unlinkDescription')}</span>
            </div>
          </>
        )}

        {/* ── Save ────────────────────────────────────────────────── */}
        <button type="submit" className={styles.btnSubmit}>
          {t('submitButton')}
        </button>
      </Form>
    </div>
  );
};
