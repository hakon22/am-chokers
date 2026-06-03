import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { BaseService } from '@server/services/app/base.service';
import { SiteSettingsService, type SiteSettingValueEntry } from '@server/services/settings/site-settings.service';
import { SiteSettingsKeyEnum } from '@server/types/site/site-settings-key.enum';
import { bodyHomeHeroSettingsSchema, bodyPickupSiteSettingsSchema, bodyBestsellersSiteSettingsSchema } from '@server/utilities/site-settings.params';
import type { SiteVersion } from '@/types/SiteVersion';

const SITE_VERSION_KEY = 'SITE_VERSION';

@Singleton
export class SettingsController extends BaseService {
  private readonly siteSettingsService = Container.get(SiteSettingsService);

  /**
   * Возвращает версию сайта из Redis или PostgreSQL
   * @returns v1, v2 или v3
   */
  private resolveSiteVersion = async (): Promise<SiteVersion> => {
    let siteVersion = await this.redisService.get<SiteVersion>(SITE_VERSION_KEY);

    if (!siteVersion) {
      siteVersion = await this.siteSettingsService.getSiteVersionFromDatabase();
      await this.redisService.set(SITE_VERSION_KEY, siteVersion);
    }

    return siteVersion;
  };

  /**
   * Возвращает все публичные настройки сайта (версия, самовывоз, hero)
   */
  public getSettings = async (req: Request, res: Response) => {
    try {
      const siteVersion = await this.resolveSiteVersion();
      const siteSettings = await this.siteSettingsService.getSiteSettingsPayload(siteVersion);

      res.json({ code: 1, siteSettings });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateSiteVersion = async (req: Request, res: Response) => {
    try {
      const { version } = req.body as { version: SiteVersion };

      if (!['v1', 'v2', 'v3'].includes(version)) {
        res.status(400).json({ error: 'Invalid version' });
        return;
      }

      await this.siteSettingsService.persistSiteVersion(version);

      res.json({ code: 1, siteVersion: version });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  /**
   * Обновляет настройки самовывоза (адрес и закрытые периоды)
   */
  public updatePickupSiteSettings = async (req: Request, res: Response) => {
    try {
      const body = await bodyPickupSiteSettingsSchema.validate(req.body);
      const entries: SiteSettingValueEntry[] = [];

      if (!_.isNil(body.locationLabel)) {
        entries.push({
          key: SiteSettingsKeyEnum.PICKUP_LOCATION_LABEL,
          value: body.locationLabel,
        });
      }

      if (!_.isNil(body.blockedDateRanges)) {
        entries.push({
          key: SiteSettingsKeyEnum.PICKUP_BLOCKED_DATE_RANGES,
          value: body.blockedDateRanges,
        });
      }

      await this.siteSettingsService.persistSiteSettingValues(entries);
      const siteVersion = await this.resolveSiteVersion();
      const siteSettings = await this.siteSettingsService.getSiteSettingsPayload(siteVersion);
      res.json({ code: 1, siteSettings });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  /**
   * Обновляет текст eyebrow в hero главной (v2)
   */
  public updateHomeHeroSettings = async (req: Request, res: Response) => {
    try {
      const body = await bodyHomeHeroSettingsSchema.validate(req.body);
      const entries: SiteSettingValueEntry[] = [];

      if (!_.isNil(body.eyebrowTitle)) {
        entries.push({
          key: SiteSettingsKeyEnum.HOME_HERO_EYEBROW_TITLE,
          value: body.eyebrowTitle,
        });
      }

      if (!_.isNil(body.eyebrowSubtitle)) {
        entries.push({
          key: SiteSettingsKeyEnum.HOME_HERO_EYEBROW_SUBTITLE,
          value: body.eyebrowSubtitle,
        });
      }

      await this.siteSettingsService.persistSiteSettingValues(entries);
      const siteVersion = await this.resolveSiteVersion();
      const siteSettings = await this.siteSettingsService.getSiteSettingsPayload(siteVersion);
      res.json({ code: 1, siteSettings });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  /**
   * Обновляет режим бестселлеров на главной (ручной / автоматический)
   */
  public updateBestsellersSiteSettings = async (req: Request, res: Response) => {
    try {
      const body = await bodyBestsellersSiteSettingsSchema.validate(req.body);
      const entries: SiteSettingValueEntry[] = [{
        key: SiteSettingsKeyEnum.AUTOMATIC_SALES_HITS,
        value: body.automaticSalesHits,
      }];

      await this.siteSettingsService.persistSiteSettingValues(entries);
      const siteVersion = await this.resolveSiteVersion();
      const siteSettings = await this.siteSettingsService.getSiteSettingsPayload(siteVersion);
      res.json({ code: 1, siteSettings });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
