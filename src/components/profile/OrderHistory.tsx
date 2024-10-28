import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { LockOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { TFunction } from 'i18next';
import { useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Form, Input } from 'antd';
import { isEmpty } from 'lodash';

import { MaskedInput } from '@/components/forms/MaskedInput';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { axiosErrorHandler } from '@/utilities/axiosErrorHandler';
import { UserProfileType } from '@/types/user/User';
import { routes } from '@/routes';
import { toast } from '@/utilities/toast';
import { fetchConfirmCode, removeTelegramId, userProfileUpdate } from '@/slices/userSlice';
import { profileValidation } from '@/validations/validations';
import { ConfirmPhone } from '@/components/ConfirmPhone';

export const OrderHistory = ({ t }: { t: TFunction }) => {
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });

  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    telegramId, key, name, phone,
  } = useAppSelector((state) => state.user);

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
    try {
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
    } catch (e) {
      axiosErrorHandler(e, tToast, setIsSubmit);
    }
  };

  useEffect(() => {
    if (isConfirmed && updateValues) {
      updateProfile(updateValues);
    }
  }, [isConfirmed]);

  const password = Form.useWatch('password', form);

  return phoneConfirm && !isConfirmed ? <ConfirmPhone setState={setIsConfirmed} newPhone={phoneConfirm} /> : <Alert message={t('notFound')} type="success" />;
};
