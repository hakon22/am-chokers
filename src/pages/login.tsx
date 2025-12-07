import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import Link from 'next/link';
import { Button, Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { loginValidation } from '@/validations/validations';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { routes } from '@/routes';
import { fetchLogin } from '@/slices/userSlice';
import { SubmitContext } from '@/components/Context';
import loginImage from '@/images/login.image.jpg';
import { MobileContext } from '@/components/Context';
import type { UserLoginInterface } from '@/types/user/User';

const Login = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.login' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const dispatch = useAppDispatch();

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { isMobile } = useContext(MobileContext);

  const [form] = Form.useForm();

  const onFinish = async (values: UserLoginInterface) => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(fetchLogin(values)) as { payload: { code: number } };
    if (code === 2) {
      form.setFields([{ name: 'password', errors: [tValidation('incorrectPassword')] }]);
    } else if (code === 3) {
      form.setFields([{ name: 'phone', errors: [tValidation('userNotExists')] }]);
    }
    setIsSubmit(false);
  };

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <div className="col-12 d-flex justify-content-between">
        {!isMobile
          ? (
            <div className="col-5" style={{ marginTop: '12%' }}>
              <Image src={loginImage} width={600} height={600} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
            </div>
          )
          : null}
        <div className="col-12 col-xl-6 d-flex flex-column align-items-center" style={{ marginTop: isMobile ? '100px' : '22%' }}>
          <h1 className="mb-5">{t('title')}</h1>
          <Form name="login" className="col-12 col-xl-8" form={form} onFinish={onFinish}>
            <Form.Item<UserLoginInterface> name="phone" rules={[loginValidation]}>
              <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
            </Form.Item>
            <Form.Item<UserLoginInterface> name="password" rules={[loginValidation]}>
              <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('password')} />
            </Form.Item>
            <div className="d-flex justify-content-between mb-3-5">
              <Link className="text-primary fw-light" href={routes.page.base.signupPage}>
                {t('noAccount')}
              </Link>
              <Link className="text-primary fw-light" href={routes.page.base.recoveryPage}>
                {t('forgotPassword')}
              </Link>
            </div>
            <div className="d-flex col-12 mb-3">
              <Button htmlType="submit" className="w-100 button fs-5" disabled={isSubmit}>
                {t('submitButton')}
              </Button>
            </div>
            <p className="text-muted text-center">{t('accept', { submitButton: t('submitButton') })}<Link className="text-primary fw-light" href={routes.page.base.privacyPolicy} title={t('policy')}>{t('policy')}</Link></p>
          </Form>
        </div>
      </div>
    </>
  );
};

export default Login;
