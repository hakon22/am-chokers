import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Alert } from 'react-bootstrap';
import { useContext } from 'react';

import { Helmet } from '@/components/Helmet';
import { useAppDispatch } from '@/utilities/hooks';
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

  const router = useRouter();
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
      <div className="col-12 d-flex gap-5">
        {!isMobile
          ? (
            <div className="col-5" style={{ marginTop: '12%' }}>
              <Image src={loginImage} width={600} height={600} unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
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
              <Alert.Link className="text-primary fw-light fs-7" onClick={() => router.push(routes.signupPage)}>
                {t('noAccount')}
              </Alert.Link>
              <Alert.Link className="text-primary fw-light fs-7" onClick={() => router.push(routes.recoveryPage)}>
                {t('forgotPassword')}
              </Alert.Link>
            </div>
            <div className="d-flex col-12">
              <Button htmlType="submit" className="w-100 button fs-5" disabled={isSubmit}>
                {t('submitButton')}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </>
  );
};

export default Login;
