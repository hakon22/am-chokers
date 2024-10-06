import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch } from '@/utilities/hooks';
import { loginValidation } from '@/validations/validations';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { routes } from '@/routes';
import { Alert } from 'react-bootstrap';
import { fetchLogin } from '@/slices/userSlice';
import { useContext } from 'react';
import { SubmitContext } from '@/components/Context';
import loginImage from '@/images/login.image.jpg';

type LoginType = {
  phone: string;
  password: string;
};

const Login = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.login' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const [form] = Form.useForm();

  const onFinish = async (values: LoginType) => {
    setIsSubmit(true);
    const { payload: { code } } = await dispatch(fetchLogin(values)) as { payload: { code: number } };
    if (code === 1) {
      console.log('ok');
    } else if (code === 2) {
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
        <div className="col-5" style={{ marginTop: '12%' }}>
          <Image src={loginImage} className="w-100" style={{ height: '80%', borderRadius: '15px' }} alt={t('title')} />
        </div>
        <div className="col-6 d-flex flex-column align-items-center" style={{ marginTop: '22%' }}>
          <h1 className="mb-5">{t('title')}</h1>
          <Form name="login" className="col-8" form={form} onFinish={onFinish}>
            <Form.Item<LoginType> name="phone" rules={[loginValidation]}>
              <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined className="site-form-item-icon" />} placeholder={t('phone')} />
            </Form.Item>
            <Form.Item<LoginType> name="password" rules={[loginValidation]}>
              <Input.Password size="large" prefix={<LockOutlined className="site-form-item-icon" />} type="password" placeholder={t('password')} />
            </Form.Item>
            <div className="d-flex justify-content-end mb-3-5">
              <Alert.Link className="text-primary fw-light fs-7" onClick={() => router.push(routes.recoveryPage)}>
                {t('forgotPassword')}
              </Alert.Link>
            </div>
            <div className="d-flex col-12">
              <Button htmlType="submit" className="w-100 button fs-5">
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
