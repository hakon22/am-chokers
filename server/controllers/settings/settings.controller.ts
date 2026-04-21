import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { SiteSettingsService } from '@server/services/settings/site.settings.service';
import type { SiteVersion } from '@/types/SiteVersion';
import type { SavePickupSiteSettingsBody } from '@server/services/settings/site.settings.service';

const SITE_VERSION_KEY = 'SITE_VERSION';

@Singleton
export class SettingsController extends BaseService {
  private readonly siteSettingsService = Container.get(SiteSettingsService);

  public getSiteVersion = async (req: Request, res: Response) => {
    try {
      let siteVersion = await this.redisService.get<SiteVersion>(SITE_VERSION_KEY);

      if (!siteVersion) {
        siteVersion = await this.siteSettingsService.getSiteVersionFromDatabase();
        await this.redisService.set(SITE_VERSION_KEY, siteVersion);
      }

      const pickup = await this.siteSettingsService.getPublicPickupPayload();

      res.json({ code: 1, siteVersion, pickup });
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
      const body = req.body as SavePickupSiteSettingsBody;
      await this.siteSettingsService.savePickupSiteSettings(body);
      const pickup = await this.siteSettingsService.getPublicPickupPayload();
      res.json({ code: 1, pickup });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
