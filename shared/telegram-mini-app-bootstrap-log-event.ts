import type { TelegramMiniAppBootstrapLogPhaseEnum } from '@shared/enums/telegram-mini-app-bootstrap-log-phase.enum';

export interface TelegramMiniAppBootstrapLogEvent {
  phase: TelegramMiniAppBootstrapLogPhaseEnum;
  bootstrapPhase?: string;
  loadAttempt?: number;
  elapsedMilliseconds?: number;
  scriptUrl?: string;
  hasTelegramWebApp?: boolean;
  hasHashLaunchParams?: boolean;
  initDataLength?: number;
  authCode?: number;
  detail?: string;
}
