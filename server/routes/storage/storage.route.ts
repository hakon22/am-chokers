import { Container, Singleton } from 'typescript-ioc';
import type { Router } from 'express';

import { BaseRouter } from '@server/routes/base.route';
import { ImageService } from '@server/services/storage/image.service';

@Singleton
export class StorageRoute extends BaseRouter {
  private readonly imageService = Container.get(ImageService);

  public set = (router: Router) => {
    router.post(this.routes.storage.image.upload({ isServer: true }), this.middlewareService.jwtToken, this.imageService.upload(), this.imageService.uploadHandler);
    router.delete(this.routes.storage.image.deleteOne(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.deleteOne);
    router.post(this.routes.storage.image.setCoverImage, this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.setCoverImage);
    router.delete(this.routes.storage.image.removeCoverImage(), this.middlewareService.jwtToken, this.middlewareService.checkAdminAccess, this.imageService.removeCoverImage);
    router.get(this.routes.storage.image.getCoverImages({ isServer: true }), this.imageService.getCoverImages);
  };
}
