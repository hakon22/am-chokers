import { useTranslation } from 'react-i18next';
import { Alert } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { PhoneOutlined } from '@ant-design/icons';
import { Button, Form, Result } from 'antd';
import { useContext, useState } from 'react';
import axios from 'axios';

import { MaskedInput } from '@/components/forms/MaskedInput';
import { SubmitContext, AuthContext, MobileContext } from '@/components/Context';
import { loginValidation } from '@/validations/validations';
import { routes } from '@/routes';
import { Helmet } from '@/components/Helmet';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';


type RecoveryType = {
  phone: string;
};

const Recovery = () => {
  const { t } = useTranslation('translation', { keyPrefix: 'pages.recovery' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const router = useRouter();

  const [form] = Form.useForm();

  const { setIsSubmit, isSubmit } = useContext(SubmitContext);
  const { loggedIn } = useContext(AuthContext);
  const { isMobile } = useContext(MobileContext);

  const [isSend, setIsSend] = useState(false);

  const onFinish = async (values: RecoveryType) => {
    try {
      setIsSubmit(true);
      const { data: { code } } = await axios.post(routes.recoveryPassword, values);
      if (code === 1) {
        setIsSend(true);
      } else if (code === 2) {
        form.setFields([{ name: 'phone', errors: [tValidation('userNotExists')] }]);
      }
      setIsSubmit(false);
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  return !loggedIn && (
    <>
      <Helmet title={t('title')} description={t('description')} />
      {isSend ? (
        <Result
          status="success"
          title={t('resultTitle')}
          subTitle={t('resultSubTitle')}
          style={{ marginTop: isMobile ? '100px' : '15%' }}
          extra={<Button className="button col-xl-2 mx-auto" onClick={() => router.push(routes.loginPage)}>{t('home')}</Button>}
        />
      ) : (
        <div className="d-flex justify-content-center" style={{ marginTop: '15%' }}>
          <div className="my-5 col-12 d-flex flex-column align-items-center gap-5">
            <h1 className="mb-5">{t('title')}</h1>
            <div className="col-12 col-xl-6">
              <Form name="recovery" form={form} onFinish={onFinish}>
                <Form.Item<RecoveryType> name="phone" rules={[loginValidation]}>
                  <MaskedInput mask="+7 (000) 000-00-00" size="large" prefix={<PhoneOutlined rotate={90} />} placeholder={t('phone')} />
                </Form.Item>
                <div className="d-flex justify-content-end mb-3-5">
                  <Alert.Link className="text-primary fw-light" onClick={() => router.push(routes.loginPage)}>
                    {t('rememberPassword')}
                  </Alert.Link>
                </div>
                <div className="d-flex justify-content-center col-12">
                  <Button htmlType="submit" className="button fs-5" disabled={isSubmit}>
                    {t('submitButton')}
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Recovery;
