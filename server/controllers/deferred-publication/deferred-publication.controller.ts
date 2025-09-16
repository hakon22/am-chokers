import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';

import { DeferredPublicationEntity } from '@server/db/entities/deferred.publication.entity';
import { BaseService } from '@server/services/app/base.service';
import { deferredPublicationSchema } from '@/validations/validations';
import { DeferredPublicationService } from '@server/services/deferred-publication/deferred-publication.service';
import { paramsIdSchema } from '@server/utilities/convertation.params';

@Singleton
export class DeferredPublicationController extends BaseService {
  private readonly deferredPublicationService = Container.get(DeferredPublicationService);

  public findOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const deferredPublication = await this.deferredPublicationService.findOne(params, user.lang);

      res.json({ code: 1, deferredPublication });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public findMany = async (req: Request, res: Response) => {
    try {
      const deferredPublications = await this.deferredPublicationService.findMany();

      res.json({ code: 1, deferredPublications });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await deferredPublicationSchema.validate(req.body) as DeferredPublicationEntity;

      const result = await this.deferredPublicationService.updateOne(params, body, user.lang);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const deferredPublication = await this.deferredPublicationService.deleteOne(params, user.lang);

      res.json({ code: 1, deferredPublication });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const deferredPublication = await this.deferredPublicationService.restoreOne(params, user.lang);

      res.json({ code: 1, deferredPublication });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
