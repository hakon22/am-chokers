import type { Request, Response } from 'express';
import { Singleton } from 'typescript-ioc';

import { SiteSettingsEntity } from '@server/db/entities/site.settings.entity';
import { BaseService } from '@server/services/app/base.service';
import type { SiteVersion } from '@/types/SiteVersion';

const SITE_VERSION_KEY = 'SITE_VERSION';
const DEFAULT_VERSION: SiteVersion = 'v1';

@Singleton
export class SettingsController extends BaseService {
  public getSiteVersion = async (req: Request, res: Response) => {
    try {
      let siteVersion = await this.redisService.get<SiteVersion>(SITE_VERSION_KEY);

      if (!siteVersion) {
        const setting = await SiteSettingsEntity.findOne({ where: { key: 'siteVersion' } });
        siteVersion = (setting?.value as SiteVersion) ?? DEFAULT_VERSION;
        await this.redisService.set(SITE_VERSION_KEY, siteVersion);
      }

      res.json({ code: 1, siteVersion });
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

      await SiteSettingsEntity.upsert(
        { key: 'siteVersion', value: version },
        { conflictPaths: ['key'] },
      );

      await this.redisService.set(SITE_VERSION_KEY, version);

      res.json({ code: 1, siteVersion: version });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
