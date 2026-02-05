import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { BannerController } from '@server/controllers/banner/banner.controller';

@Singleton
export class BannerRoute extends BaseRouter {
  private readonly bannerController = Container.get(BannerController);

  public set = (router: Router) => {
    router.get(this.routes.banner.findMany({ isServer: true }), this.bannerController.findMany);
    router.post(this.routes.banner.createOne, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.bannerController.createOne);
    router.put(this.routes.banner.updateOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.bannerController.updateOne);
    router.delete(this.routes.banner.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.bannerController.deleteOne);
    router.patch(this.routes.banner.restoreOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.bannerController.restoreOne);
    router.patch(this.routes.banner.reorder, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.bannerController.reorder);
  };
}
