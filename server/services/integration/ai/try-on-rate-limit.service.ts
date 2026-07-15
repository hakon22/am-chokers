import { Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';

export type TryOnRateLimitWindowType = 'minute' | 'day';

export interface TryOnRateLimitResultInterface {
  allowed: boolean;
  window: TryOnRateLimitWindowType | null;
}

@Singleton
export class TryOnRateLimitService extends BaseService {
  private readonly rateLimitPerMinute = 2;

  private readonly rateLimitPerDay = 20;

  private readonly minuteWindowSeconds = 60;

  private readonly dayWindowSeconds = 86400;

  private readonly uploadRateLimitPerMinute = 10;

  private readonly uploadRateLimitPerDay = 100;

  private readonly uploadMinuteWindowSeconds = 60;

  private readonly uploadDayWindowSeconds = 86400;

  /**
   * Проверяет минутный и суточный лимиты по IP-хешу
   * @param ipHash - SHA-256 хеш IP
   * @returns allowed и какое окно сработало при отказе
   */
  public checkLimits = async (ipHash: string): Promise<TryOnRateLimitResultInterface> => {
    const minuteKey = `try-on:rate:${ipHash}:minute`;
    const dayKey = `try-on:rate:${ipHash}:day`;

    const minuteCount = await this.redisService.incrementWithWindowTtl(minuteKey, this.minuteWindowSeconds);
    if (minuteCount > this.rateLimitPerMinute) {
      return { allowed: false, window: 'minute' };
    }

    const dayCount = await this.redisService.incrementWithWindowTtl(dayKey, this.dayWindowSeconds);
    if (dayCount > this.rateLimitPerDay) {
      return { allowed: false, window: 'day' };
    }

    return { allowed: true, window: null };
  };

  /**
   * Проверяет лимиты загрузки temp-фото для примерки
   * @param ipHash - SHA-256 хеш IP
   * @returns allowed и какое окно сработало при отказе
   */
  public checkUploadLimits = async (ipHash: string): Promise<TryOnRateLimitResultInterface> => {
    const minuteKey = `try-on:upload:rate:${ipHash}:minute`;
    const dayKey = `try-on:upload:rate:${ipHash}:day`;

    const minuteCount = await this.redisService.incrementWithWindowTtl(minuteKey, this.uploadMinuteWindowSeconds);
    if (minuteCount > this.uploadRateLimitPerMinute) {
      return { allowed: false, window: 'minute' };
    }

    const dayCount = await this.redisService.incrementWithWindowTtl(dayKey, this.uploadDayWindowSeconds);
    if (dayCount > this.uploadRateLimitPerDay) {
      return { allowed: false, window: 'day' };
    }

    return { allowed: true, window: null };
  };
}
