import { Button, Form, Progress } from 'antd';
import { useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import VerificationInput from 'react-verification-input';

import { SubmitContext } from '@/components/Context';
import { fetchConfirmCode } from '@/slices/userSlice';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { toast } from '@/utilities/toast';
import v2Styles from '@/themes/v2/components/ConfirmPhone.module.scss';

const SMS_COOLDOWN_SECONDS = 59;

export type ConfirmPhoneVariant = 'legacy' | 'v2';

export const ConfirmPhone = ({
  setState,
  newPhone,
  variant = 'legacy',
}: {
  setState: (arg: boolean) => void;
  newPhone?: string;
  variant?: ConfirmPhoneVariant;
}) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.confirmPhone' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const { t: tValidation } = useTranslation('translation', { keyPrefix: 'validation' });
  const dispatch = useAppDispatch();

  const { key, loadingStatus, phone = '' } = useAppSelector((state) => state.user);

  const { setIsSubmit } = useContext(SubmitContext);

  const [timer, setTimer] = useState<number>(SMS_COOLDOWN_SECONDS);
  const [value, setValue] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onFinish = async (codeValue: string) => {
    const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: newPhone || phone, key, code: codeValue })) as { payload: { code: number } };
    if (code === 2) {
      setState(true);
    }
    if (code === 3) {
      setValue('');
      setErrorMessage(tValidation('incorrectCode'));
    }
    if (code === 4) {
      setValue('');
      setErrorMessage(tValidation('timeNotOver'));
    }
  };

  const repeatSMS = async () => {
    const { payload: { code } } = await dispatch(fetchConfirmCode({ phone: newPhone || phone })) as { payload: { code: number } };
    if (code === 1) {
      setValue('');
      setErrorMessage('');
      setTimer(SMS_COOLDOWN_SECONDS);
      toast(tToast('sendSmsSuccess'), 'success');
    } else {
      toast(tToast('sendSmsError'), 'error');
    }
  };

  useEffect(() => {
    if (timer) {
      const timerAlive = setTimeout(setTimer, 1000, timer - 1);
      return () => clearTimeout(timerAlive);
    }
    return undefined;
  }, [timer]);

  useEffect(() => {
    setIsSubmit(loadingStatus !== 'finish');
    return () => setIsSubmit(false);
  }, [loadingStatus]);

  const cooldownProgress = timer > 0 ? timer / SMS_COOLDOWN_SECONDS : 0;

  if (variant === 'v2') {
    return (
      <Form name="confirmPhone" onFinish={onFinish} className={v2Styles.root}>
        <h2 className={v2Styles.title}>{t('enterTheCode')}</h2>
        <div className={v2Styles.otpSection}>
          <VerificationInput
            validChars="0-9"
            value={value}
            inputProps={{ inputMode: 'numeric' }}
            length={4}
            placeholder="X"
            classNames={{
              container: v2Styles.otpContainer,
              character: v2Styles.otpChar,
              characterInactive: v2Styles.otpCharInactive,
              characterSelected: v2Styles.otpCharSelected,
              characterFilled: v2Styles.otpCharFilled,
            }}
            autoFocus
            onComplete={onFinish}
            onChange={setValue}
          />
          {errorMessage && <div className={v2Styles.error}>{errorMessage}</div>}
        </div>
        <p className={v2Styles.hint}>{t('didntReceive')}</p>
        {timer > 0 ? (
          <>
            <p className={v2Styles.timer}>{t('timerCode', { count: timer })}</p>
            <div className={v2Styles.progressTrack} aria-hidden>
              <div className={v2Styles.progressFill} style={{ width: `${cooldownProgress * 100}%` }} />
            </div>
          </>
        ) : (
          <button type="button" className={v2Styles.resend} onClick={repeatSMS}>
            {t('sendAgain')}
          </button>
        )}
      </Form>
    );
  }

  return (
    <Form name="confirmPhone" onFinish={onFinish} className="d-flex flex-column align-items-center fs-5 my-4 font-oswald w-100">
      <span className="mb-3-5 text-center fs-4">{t('enterTheCode')}</span>
      <div className="d-flex justify-content-center mb-5 col-10 position-relative">
        <VerificationInput
          validChars="0-9"
          value={value}
          inputProps={{ inputMode: 'numeric' }}
          length={4}
          placeholder="X"
          classNames={{
            container: 'd-flex gap-3',
            character: 'verification-character',
          }}
          autoFocus
          onComplete={onFinish}
          onChange={setValue}
        />
        {errorMessage && <div className="error-message anim-show">{errorMessage}</div>}
      </div>
      <p className="text-muted">{t('didntReceive')}</p>
      {timer ? (
        <div>
          <span className="text-muted">{t('timerCode', { count: timer })}</span>
          <Progress showInfo={false} />
        </div>
      ) : <Button className="border-0 button" style={{ boxShadow: 'unset' }} onClick={repeatSMS}>{t('sendAgain')}</Button>}
    </Form>
  );
};
