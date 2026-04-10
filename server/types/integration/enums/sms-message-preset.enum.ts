import { SmsProviderEnum } from '@server/types/integration/enums/sms-provider.enum';

export enum SmsMessagePreset {
  CONFIRMATION_CODE = 'CONFIRMATION_CODE',
  PASSWORD = 'PASSWORD',
  RECEIPT = 'RECEIPT',
}

/** Соответствие пресета основному оператору (резерв при ошибке — MAIN_SMS, если основной не MAIN_SMS). */
export const smsPresetPrimaryProvider: Record<SmsMessagePreset, SmsProviderEnum> = {
  [SmsMessagePreset.CONFIRMATION_CODE]: SmsProviderEnum.GREEN_SMS,
  [SmsMessagePreset.PASSWORD]: SmsProviderEnum.SMS_PROSTO,
  [SmsMessagePreset.RECEIPT]: SmsProviderEnum.MAIN_SMS,
};
