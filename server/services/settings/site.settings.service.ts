import _ from 'lodash';
import moment from 'moment';
import { Singleton } from 'typescript-ioc';

import { SiteSettingsEntity } from '@server/db/entities/site.settings.entity';
import { BaseService } from '@server/services/app/base.service';
import { DateFormatEnum } from '@/utilities/enums/date.format.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { SiteSettingsKeyEnum } from '@server/types/site/site.settings.key.enum';
import type { SiteSettingsJsonValue } from '@server/types/site/site.settings.json.value.type';
import type { PickupBlockedDateRangeInterface } from '@server/types/site/pickup.blocked.date.range.interface';
import type { SiteVersion } from '@/types/SiteVersion';

const REDIS_SITE_VERSION_KEY = 'SITE_VERSION';

const ALLOWED_SITE_VERSIONS: SiteVersion[] = ['v1', 'v2', 'v3'];

const DEFAULT_SITE_VERSION: SiteVersion = 'v1';

const MAX_PICKUP_BLOCKED_RANGE_ROWS = 50;

export type PublicPickupSettingsPayload = {
  locationLabel: string;
  blockedDateRanges: PickupBlockedDateRangeInterface[];
};

export type SavePickupSiteSettingsBody = {
  locationLabel?: string;
  blockedDateRanges?: PickupBlockedDateRangeInterface[];
};

@Singleton
export class SiteSettingsService extends BaseService {
  /**
   * Приводит значение из БД к допустимой версии сайта
   * @param value - сырое JSONB-значение строки настроек siteVersion
   * @returns одна из v1 / v2 / v3 либо значение по умолчанию
   */
  private normalizeSiteVersion = (value: SiteSettingsJsonValue | undefined): SiteVersion => {
    if (typeof value === 'string' && ALLOWED_SITE_VERSIONS.includes(value as SiteVersion)) {
      return value as SiteVersion;
    }
    return DEFAULT_SITE_VERSION;
  };

  /**
   * Возвращает версию сайта из PostgreSQL
   * @returns сохранённая версия или v1 по умолчанию
   */
  public getSiteVersionFromDatabase = async (): Promise<SiteVersion> => {
    const setting = await SiteSettingsEntity.findOne({ where: { key: SiteSettingsKeyEnum.SITE_VERSION } });
    return this.normalizeSiteVersion(setting?.value);
  };

  /**
   * Сохраняет версию сайта в БД и обновляет ключ в Redis
   * @param version - новая версия интерфейса (v1, v2, v3)
   * @returns Promise по завершении upsert и записи в Redis
   */
  public persistSiteVersion = async (version: SiteVersion): Promise<void> => {
    await SiteSettingsEntity.upsert(
      { key: SiteSettingsKeyEnum.SITE_VERSION, value: version },
      { conflictPaths: ['key'] },
    );
    await this.redisService.set(REDIS_SITE_VERSION_KEY, version);
  };

  /**
   * Читает текстовую подпись точки самовывоза из БД
   * @returns непустая строка или пустая, если настройка отсутствует
   */
  public getPickupLocationLabelFromDatabase = async (): Promise<string> => {
    const row = await SiteSettingsEntity.findOne({ where: { key: SiteSettingsKeyEnum.PICKUP_LOCATION_LABEL } });
    if (_.isNil(row?.value) || typeof row.value !== 'string') {
      return '';
    }
    return row.value.trim();
  };

  /**
   * Нормализует и фильтрует массив закрытых периодов из сырого значения БД
   * @param value - значение колонки value для ключа pickupBlockedDateRanges
   * @returns только валидные периоды с корректными датами
   */
  private parsePickupBlockedDateRanges = (value: SiteSettingsJsonValue | undefined): PickupBlockedDateRangeInterface[] => {
    if (_.isNil(value) || !Array.isArray(value)) {
      return [];
    }
    const parsed: PickupBlockedDateRangeInterface[] = [];
    for (const entry of value) {
      if (_.isNil(entry) || typeof entry !== 'object') {
        continue;
      }
      const { startDate, endDate } = entry as PickupBlockedDateRangeInterface;
      if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        continue;
      }
      const start = moment(startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      const end = moment(endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      if (!start.isValid() || !end.isValid() || end.isBefore(start, 'day')) {
        continue;
      }
      parsed.push({
        startDate: start.format(DateFormatEnum.YYYY_MM_DD),
        endDate: end.format(DateFormatEnum.YYYY_MM_DD),
      });
    }
    return parsed.slice(0, MAX_PICKUP_BLOCKED_RANGE_ROWS);
  };

  /**
   * Возвращает список закрытых периодов самовывоза из БД
   * @returns массив периодов в формате YYYY-MM-DD
   */
  public getPickupBlockedDateRangesFromDatabase = async (): Promise<PickupBlockedDateRangeInterface[]> => {
    const row = await SiteSettingsEntity.findOne({ where: { key: SiteSettingsKeyEnum.PICKUP_BLOCKED_DATE_RANGES } });
    return this.parsePickupBlockedDateRanges(row?.value);
  };

  /**
   * Собирает публичный объект настроек самовывоза для API и клиента
   * @returns подпись точки и закрытые периоды
   */
  public getPublicPickupPayload = async (): Promise<PublicPickupSettingsPayload> => {
    const [locationLabel, blockedDateRanges] = await Promise.all([
      this.getPickupLocationLabelFromDatabase(),
      this.getPickupBlockedDateRangesFromDatabase(),
    ]);
    return { locationLabel, blockedDateRanges };
  };

  /**
   * Проверяет, что выбранная дата самовывоза не входит в закрытые периоды
   * @param deliveryDateTime - дата и время из формы заказа (ISO или Date)
   * @param ranges - нормализованные периоды из настроек
   * @param userLang - язык пользователя для сообщения об ошибке
   * @returns void; при запрете выбрасывает Error
   */
  public assertPickupDateTimeNotBlocked = (
    deliveryDateTime: string | Date,
    ranges: PickupBlockedDateRangeInterface[],
    userLang: UserLangEnum,
  ): void => {
    if (_.isEmpty(ranges)) {
      return;
    }
    const day = moment(deliveryDateTime).startOf('day');
    const isBlocked = ranges.some((range) => {
      const start = moment(range.startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      const end = moment(range.endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      if (!start.isValid() || !end.isValid()) {
        return false;
      }
      return day.isBetween(start, end, 'day', '[]');
    });
    if (isBlocked) {
      throw new Error(userLang === UserLangEnum.RU
        ? 'Выбранная дата самовывоза недоступна. Выберите другую дату.'
        : 'The selected pickup date is not available. Please choose another date.');
    }
  };

  /**
   * Строго проверяет и нормализует периоды из PATCH до записи в БД
   * @param ranges - массив периодов из тела запроса
   * @returns массив с датами в формате YYYY-MM-DD
   */
  private normalizeBlockedRangesStrict = (ranges: PickupBlockedDateRangeInterface[]): PickupBlockedDateRangeInterface[] => {
    if (ranges.length > MAX_PICKUP_BLOCKED_RANGE_ROWS) {
      throw new Error(`Too many blocked date ranges (max ${MAX_PICKUP_BLOCKED_RANGE_ROWS})`);
    }
    return ranges.map((range, index) => {
      const { startDate, endDate } = range;
      if (typeof startDate !== 'string' || typeof endDate !== 'string') {
        throw new Error(`Invalid pickup blocked date range at index ${index}`);
      }
      const start = moment(startDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      const end = moment(endDate, DateFormatEnum.YYYY_MM_DD, true).startOf('day');
      if (!start.isValid() || !end.isValid()) {
        throw new Error(`Invalid pickup blocked date range at index ${index}`);
      }
      if (end.isBefore(start, 'day')) {
        throw new Error(`pickupBlockedDateRanges[${index}]: endDate must be on or after startDate`);
      }
      return {
        startDate: start.format(DateFormatEnum.YYYY_MM_DD),
        endDate: end.format(DateFormatEnum.YYYY_MM_DD),
      };
    });
  };

  /**
   * Сохраняет настройки самовывоза (частичное обновление по переданным полям)
   * @param body - опционально locationLabel и/или blockedDateRanges
   * @returns Promise по завершении upsert в site_settings
   */
  public savePickupSiteSettings = async (body: SavePickupSiteSettingsBody): Promise<void> => {
    const { locationLabel, blockedDateRanges } = body;
    if (!_.isNil(locationLabel)) {
      const trimmed = locationLabel.trim();
      await SiteSettingsEntity.upsert(
        { key: SiteSettingsKeyEnum.PICKUP_LOCATION_LABEL, value: trimmed },
        { conflictPaths: ['key'] },
      );
    }
    if (!_.isNil(blockedDateRanges)) {
      const normalized = this.normalizeBlockedRangesStrict(blockedDateRanges);
      await SiteSettingsEntity.upsert(
        { key: SiteSettingsKeyEnum.PICKUP_BLOCKED_DATE_RANGES, value: normalized },
        { conflictPaths: ['key'] },
      );
    }
  };
}
