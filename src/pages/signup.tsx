import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button, Form, Input } from 'antd';
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Helmet } from '@/components/Helmet';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { signupValidation } from '@/validations/validations';
import { MaskedInput } from '@/components/forms/MaskedInput';
import { routes } from '@/routes';
import { Alert } from 'react-bootstrap';
import { useContext, useEffect, useState } from 'react';
import { SubmitContext } from '@/components/Context';
import loginImage from '@/images/login.image.jpg';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import axios from 'axios';
import { toast } from '@/utilities/toast';
import { ConfirmPhone } from '@/components/ConfirmPhone';
import { fetchConfirmCode } from '@/slices/userSlice';

type SignupType = {
  name: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

const Signup = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.signup' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });

  const router = useRouter();
  const dispatch = useAppDispatch();

  const { key } = useAppSelector((state) => state.user);

  const [isProcessConfirmed, setIsProcessConfirmed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const { setIsSubmit } = useContext(SubmitContext);

  const [form] = Form.useForm();

  const onFinish = async (values: SignupType) => {
    try {
      setIsSubmit(true);
      const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: values.phone, key })) as { payload: { code: number } };
      if (code === 1) {
        setIsProcessConfirmed(true);
      }
      if (code === 4) {
        toast(tToast('timeNotOverForSms'), 'error');
      }
      if (code === 5) {
        setIsConfirmed(true);
      }
      if (code === 6) {
        form.setFields([{ name: 'phone', errors: [tToast('userAlreadyExists')] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      setTimeout(setIsSubmit, 1500, false);
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      router.push(routes.profilePage);
    }
  }, [isConfirmed]);

  return (
    <>
      <Helmet title={t('title')} description={t('description')} />
      <div className="col-12 d-flex gap-5">
        <div className="col-5" style={{ marginTop: '12%' }}>
          <Image src={loginImage} width={600} height={600} unoptimized sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" quality={100} style={{ borderRadius: '15px' }} alt={t('title')} />
        </div>
        <div className="col-6 d-flex flex-column align-items-center" style={{ marginTop: '18%' }}>
          {isProcessConfirmed ? <ConfirmPhone setState={setIsConfirmed} /> : (
            <>
              <h1 className="mb-5">{t('title')}</h1>
              <Form name="signup" className="col-8" form={form} onFinish={onFinish}>
                <Form.Item<SignupType> name="name" rules={[signupValidation]} required>
                  <Input size="large" prefix={<UserOutlined />} placeholder={t('name')} />
                </Form.Item>
                <Form.Item<SignupType> name="phone" rules={[signupValidation]}>
                  <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined className="flipped-icon" />} placeholder={t('phone')} />
                </Form.Item>
                <Form.Item<SignupType> name="password" rules={[signupValidation]} required>
                  <Input.Password size="large" prefix={<LockOutlined />} type="password" placeholder={t('password')} />
                </Form.Item>
                <Form.Item<SignupType>
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
                  <Alert.Link className="text-primary fw-light fs-7" onClick={() => router.push(routes.loginPage)}>
                    {t('haveAccount')}
                  </Alert.Link>
                </div>
                <div className="d-flex col-12">
                  <Button htmlType="submit" className="w-100 button fs-5">
                    {t('next')}
                  </Button>
                </div>
              </Form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
