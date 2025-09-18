import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { useContext, useEffect, useState } from 'react';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { signupValidation } from '@/validations/validations';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { routes } from '@/routes';
import { MobileContext, SubmitContext } from '@/components/Context';
import loginImage from '@/images/login.image.jpg';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { toast } from '@/utilities/toast';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { fetchConfirmCode, fetchSignup } from '@/slices/userSlice';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { UserSignupInterface } from '@/types/user/User';

const Signup = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.signup' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { key, lang } = useAppSelector((state) => state.user);

  const [isProcessConfirmed, setIsProcessConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [user, setUser] = useState<UserSignupInterface>();

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const onFinish = async (values: UserSignupInterface) => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: values.phone, key })) as { payload: { code: number } };
    if (code === 1) {
      setUser(values);
      setIsProcessConfirmed(true);
    }
    if (code === 4) {
      toast(tToast('timeNotOverForSms'), 'error');
    }
    if (code === 5) {
      form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
    }
    setIsSubmit(false);
  };

  useEffect(() => {
    if (isConfirmed && user) {
      dispatch(fetchSignup({ ...user, lang: lang as UserLangEnum }))
        .then(() => { router.push(routes.page.profile.personalData); })
        .catch((e) => { axiosErrorHandler(e, tToast, setIsSubmit); });
    }
  }, [isConfirmed, user]);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <div className="col-12 d-flex justify-content-between">
        {!isMobile
          ? (
            <div className="col-5" style={{ marginTop: '12%' }}>
              <Image src={loginImage} width={600} height={600} unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
            </div>
          )
          : null}
        <div className="col-12 col-xl-6 d-flex flex-column align-items-center" style={{ marginTop: isMobile ? '100px' : '18%' }}>
          {isProcessConfirmed ? <ConfirmPhone setState={setIsConfirmed} /> : (
            <>
              <h1 className="mb-5">{t('title')}</h1>
              <Form name="signup" className="col-12 col-xl-8" form={form} onFinish={onFinish}>
                <Form.Item<UserSignupInterface> name="name" rules={[signupValidation]} required>
                  <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} />
                </Form.Item>
                <Form.Item<UserSignupInterface> name="phone" rules={[signupValidation]}>
                  <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
                </Form.Item>
                <Form.Item<UserSignupInterface> name="password" rules={[signupValidation]} required>
                  <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('password')} />
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
                  <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('confirmPassword')} />
                </Form.Item>
                <div className="d-flex justify-content-end mb-3-5">
                  <Link className="text-primary fw-light"href={routes.page.base.loginPage}>
                    {t('haveAccount')}
                  </Link>
                </div>
                <div className="d-flex col-12 mb-3">
                  <Button htmlType="submit" className="w-100 button fs-5" disabled={isSubmit}>
                    {t('next')}
                  </Button>
                </div>
                <p className="text-muted text-center">{t('accept', { submitButton: t('next') })}<Link className="text-primary fw-light" href={routes.page.base.privacyPolicy} title={t('policy')}>{t('policy')}</Link></p>
              </Form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
