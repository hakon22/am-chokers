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
  const dispatch = useAppDispatch();
  const router = useRouter();

  const {
    telegramId, key, name, phone,
  } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  return <Alert message={t('notFound')} type="success" />;
};
