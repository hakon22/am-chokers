import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { SettingsController } from '@server/controllers/settings/settings.controller';

@Singleton
export class SettingsRoute extends BaseRouter {
  private readonly settingsController = Container.get(SettingsController);

  public set = (router: Router) => {
    router.get(this.routes.settings.getSiteVersion, this.settingsController.getSiteVersion);
    router.patch(
      this.routes.settings.updateSiteVersion,
      this.middlewareService.jwtToken,
      this.middlewareService.checkAdminAccess,
      this.settingsController.updateSiteVersion,
    );
    router.patch(
      this.routes.settings.updatePickupSiteSettings,
      this.middlewareService.jwtToken,
      this.middlewareService.checkAdminAccess,
      this.settingsController.updatePickupSiteSettings,
    );
  };
}
