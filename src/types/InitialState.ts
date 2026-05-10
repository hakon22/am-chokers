import type { MessageTypeEnum } from '@server/types/message/enums/message.type.enum';

export type LoadingStatus = 'idle' | 'loading' | 'finish' | 'failed';
export type Error = string | null;

export interface InitialState {
  error: Error;
  loadingStatus: LoadingStatus;
  /** Канал доставки кода при последнем успешном `confirm-phone` (подписи в ConfirmPhone) */
  confirmPhoneOtpDeliveryChannel?: MessageTypeEnum;
}
