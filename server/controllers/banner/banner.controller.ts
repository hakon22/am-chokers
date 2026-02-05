import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { BannerService } from '@server/services/banner/banner.service';
import { paramsIdSchema, queryBannerParams } from '@server/utilities/convertation.params';
import { newBannerValidation } from '@/validations/validations';
import { BaseService } from '@server/services/app/base.service';
import type { BannerEntity } from '@server/db/entities/banner.entity';

@Singleton
export class BannerController extends BaseService {
  private readonly bannerService = Container.get(BannerService);

  public findMany = async (req: Request, res: Response) => {
    try {
      const query = await queryBannerParams.validate(req.query);

      const banners = await this.bannerService.findMany(query);

      res.json({ code: 1, banners });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public createOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const body = await newBannerValidation.serverValidator(req.body) as BannerEntity;

      const result = await this.bannerService.createOne(body, user.lang);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public updateOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);
      const body = await newBannerValidation.serverValidator(req.body) as BannerEntity;

      const result = await this.bannerService.updateOne(params, body, user.lang);

      res.json(result);
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const banner = await this.bannerService.deleteOne(params, user.lang);

      res.json({ code: 1, banner });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const user = this.getCurrentUser(req);
      const params = await paramsIdSchema.validate(req.params);

      const banner = await this.bannerService.restoreOne(params, user.lang);

      res.json({ code: 1, banner });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public reorder = async (req: Request, res: Response) => {
    try {
      const query = await queryBannerParams.validate(req.query);
      const body = req.body as { id: number; }[];

      const banners = await this.bannerService.reorder(body, query);

      res.json({ code: 1, banners });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };
}
