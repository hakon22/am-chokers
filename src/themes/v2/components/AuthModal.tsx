import { useContext, useEffect, useEffectEvent, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Button, Checkbox, Form, Input, Modal } from 'antd';
import { CheckCircleOutlined, LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import axios from 'axios';

import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { SubmitContext } from '@/components/Context';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { routes } from '@/routes';
import { fetchLogin, fetchConfirmCode, fetchSignup } from '@/slices/userSlice';
import { loginValidation, signupValidation } from '@/validations/validations';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import styles from '@/themes/v2/components/AuthModal.module.scss';
import type { UserLoginInterface, UserSignupInterface } from '@/types/user/User';
import type { AuthModalView } from '@/components/Context';

const LoginView = ({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: AuthModalView) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.login' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const dispatch = useAppDispatch();
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const [form] = Form.useForm();
  const isPersonalDataConsent = Form.useWatch('personalDataConsent', form);

  const onFinish = async (values: UserLoginInterface) => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(fetchLogin(values)) as { payload: { code: number; }; };
    if (code === 2) {
      form.setFields([{ name: 'password', errors: [tValidation('incorrectPassword')] }]);
    } else if (code === 3) {
      form.setFields([{ name: 'phone', errors: [tValidation('userNotExists')] }]);
    } else {
      onClose();
    }
    setIsSubmit(false);
  };

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>{t('title')}</h2>
      <Form form={form} onFinish={onFinish}>
        <Form.Item<UserLoginInterface> name="phone" rules={[loginValidation]}>
          <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
        </Form.Item>
        <Form.Item<UserLoginInterface> name="password" rules={[loginValidation]}>
          <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('password')} />
        </Form.Item>
        <Form.Item
          name="personalDataConsent"
          valuePropName="checked"
          rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error(tValidation('personalDataConsentRequired')))) }]}
          className="mb-3"
        >
          <Checkbox>
            {t('personalDataConsent')}
            <Link href={routes.page.base.privacyPolicy}> {t('policy')}</Link>
          </Checkbox>
        </Form.Item>
        <div className={styles.navLinks}>
          <button type="button" className={styles.navLink} onClick={() => onNavigate('signup')}>{t('noAccount')}</button>
          <button type="button" className={styles.navLink} onClick={() => onNavigate('recovery')}>{t('forgotPassword')}</button>
        </div>
        <Button
          type="primary"
          size="large"
          block
          htmlType="submit"
          className={styles.primaryAction}
          disabled={isSubmit || !isPersonalDataConsent}
        >
          {t('submitButton')}
        </Button>
      </Form>
    </div>
  );
};

const SignupView = ({ onClose, onNavigate }: { onClose: () => void; onNavigate: (view: AuthModalView) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.signup' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const dispatch = useAppDispatch();
  const { key, lang = UserLangEnum.RU } = useAppSelector((state) => state.user);
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const [form] = Form.useForm();
  const isPersonalDataConsent = Form.useWatch('personalDataConsent', form);
  const [isProcessConfirmed, setIsProcessConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [signupUser, setSignupUser] = useState<UserSignupInterface | undefined>();

  const onFinish = async (values: UserSignupInterface) => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: values.phone, key })) as { payload: { code: number; }; };
    if (code === 1) {
      setSignupUser({ name: values.name, phone: values.phone, password: values.password, confirmPassword: values.confirmPassword, lang: lang as UserLangEnum });
      setIsProcessConfirmed(true);
    } else if (code === 4) {
      toast(tToast('timeNotOverForSms'), 'error');
    } else if (code === 5) {
      form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (isConfirmed && signupUser) {
      dispatch(fetchSignup({ ...signupUser, lang: lang as UserLangEnum }))
        .then(() => onClose())
        .catch((error) => axiosErrorHandler(error, tToast, setIsSubmit));
    }
  }, [isConfirmed, signupUser]);

  return (
    <div className={styles.content}>
      {isProcessConfirmed ? (
        <ConfirmPhone setState={setIsConfirmed} variant="v2" />
      ) : (
        <>
          <h2 className={styles.title}>{t('title')}</h2>
          <Form form={form} onFinish={onFinish}>
            <Form.Item<UserSignupInterface> name="name" rules={[signupValidation]} required>
              <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} />
            </Form.Item>
            <Form.Item<UserSignupInterface> name="phone" rules={[signupValidation]}>
              <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
            </Form.Item>
            <Form.Item<UserSignupInterface> name="password" rules={[signupValidation]} required>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('password')} />
            </Form.Item>
            <Form.Item<UserSignupInterface>
              name="confirmPassword"
              rules={[
                signupValidation,
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(tValidation('mastMatch')));
                  },
                }),
              ]}
              required
            >
              <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('confirmPassword')} />
            </Form.Item>
            <Form.Item
              name="personalDataConsent"
              valuePropName="checked"
              rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error(tValidation('personalDataConsentRequired')))) }]}
              className="mb-3"
            >
              <Checkbox>
                {t('personalDataConsent')}
                <Link href={routes.page.base.privacyPolicy}> {t('policy')}</Link>
              </Checkbox>
            </Form.Item>
            <div className={styles.navLinks}>
              <button type="button" className={styles.navLink} onClick={() => onNavigate('login')}>{t('haveAccount')}</button>
            </div>
            <Button
              type="primary"
              size="large"
              block
              htmlType="submit"
              className={styles.primaryAction}
              disabled={isSubmit || !isPersonalDataConsent}
            >
              {t('next')}
            </Button>
          </Form>
        </>
      )}
    </div>
  );
};

const RecoveryView = ({ onNavigate }: { onNavigate: (view: AuthModalView) => void; }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.recovery' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const [form] = Form.useForm();
  const isPersonalDataConsent = Form.useWatch('personalDataConsent', form);
  const [isSent, setIsSent] = useState(false);

  const onFinish = async (values: { phone: string; }) => {
    try {
      setIsSubmit(true);
      const { data: { code } } = await axios.post(routes.user.recoveryPassword, values);
      if (code === 1) {
        setIsSent(true);
      } else if (code === 2) {
        form.setFields([{ name: 'phone', errors: [tValidation('userNotExists')] }]);
      }
      setIsSubmit(false);
    } catch (error) {
      axiosErrorHandler(error, tToast, setIsSubmit);
    }
  };

  if (isSent) {
    return (
      <div className={styles.content}>
        <CheckCircleOutlined className={styles.successIcon} />
        <p className={styles.successTitle}>{t('resultTitle')}</p>
        <p className={styles.successSubtitle}>{t('resultSubTitle')}</p>
        <Button type="primary" size="large" block className={styles.primaryAction} onClick={() => onNavigate('login')}>
          {t('home')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.content}>
      <h2 className={styles.title}>{t('title')}</h2>
      <Form form={form} onFinish={onFinish}>
        <Form.Item name="phone" rules={[loginValidation]}>
          <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
        </Form.Item>
        <Form.Item
          name="personalDataConsent"
          valuePropName="checked"
          rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error(tValidation('personalDataConsentRequired')))) }]}
          className="mb-3"
        >
          <Checkbox>
            {t('personalDataConsent')}
            <Link href={routes.page.base.privacyPolicy}> {t('policy')}</Link>
          </Checkbox>
        </Form.Item>
        <div className={styles.navLinks}>
          <button type="button" className={styles.navLink} onClick={() => onNavigate('login')}>{t('rememberPassword')}</button>
        </div>
        <Button
          type="primary"
          size="large"
          block
          htmlType="submit"
          className={styles.primaryAction}
          disabled={isSubmit || !isPersonalDataConsent}
        >
          {t('submitButton')}
        </Button>
      </Form>
    </div>
  );
};

export const AuthModal = ({ open, initialView = 'login', onClose }: { open: boolean; initialView?: AuthModalView; onClose: () => void; }) => {
  const [view, setView] = useState<AuthModalView>(initialView);
  const setViewEffect = useEffectEvent(setView);

  useEffect(() => {
    if (open) {
      setViewEffect(initialView);
    }
  }, [open, initialView]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={440}
      destroyOnClose
      zIndex={10000}
    >
      {view === 'login' && <LoginView onClose={onClose} onNavigate={setView} />}
      {view === 'signup' && <SignupView onClose={onClose} onNavigate={setView} />}
      {view === 'recovery' && <RecoveryView onNavigate={setView} />}
    </Modal>
  );
};
