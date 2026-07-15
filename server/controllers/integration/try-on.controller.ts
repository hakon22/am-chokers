import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';
import type { Request, Response } from 'express';

import { BaseService } from '@server/services/app/base.service';
import { TryOnService } from '@server/services/integration/try-on.service';
import { TryOnRateLimitService } from '@server/services/integration/ai/try-on-rate-limit.service';
import { TryOnUserImageService } from '@server/services/integration/ai/try-on-user-image.service';
import { ImageService } from '@server/services/storage/image.service';
import { AiTryOnUserRatingEnum } from '@server/types/ai/enums/ai-try-on-user-rating.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import { tryOnRequestSchema, tryOnRatingSchema } from '@/validations/validations';

@Singleton
export class TryOnController extends BaseService {
  private readonly tryOnService = Container.get(TryOnService);

  private readonly tryOnRateLimitService = Container.get(TryOnRateLimitService);

  private readonly tryOnUserImageService = Container.get(TryOnUserImageService);

  private readonly imageService = Container.get(ImageService);

  /**
   * POST /api/integration/try-on/upload — temp-фото для гостевой примерки
   * @param req - Express request (multer file)
   * @param res - Express response
   * @returns void
   */
  public uploadUserImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = this.getCurrentUser(req);
      const ipHash = this.tryOnUserImageService.hashIpAddress(this.resolveClientIp(req));
      const rateLimit = await this.tryOnRateLimitService.checkUploadLimits(ipHash);

      if (!rateLimit.allowed) {
        const message = user.lang === UserLangEnum.RU
          ? (rateLimit.window === 'day'
            ? 'Достигнут суточный лимит загрузок. Попробуйте завтра.'
            : 'Слишком много загрузок. Подождите минуту.')
          : (rateLimit.window === 'day'
            ? 'Daily upload limit reached. Try again tomorrow.'
            : 'Too many uploads. Please wait a minute.');
        res.status(429).json({ code: 3, message });
        return;
      }

      await this.imageService.uploadHandler(req, res);
    } catch (error) {
      this.errorHandler(error, res);
    }
  };

  /**
   * POST /api/integration/try-on
   * @param req - Express request
   * @param res - Express response
   * @returns void
   */
  public createTryOn = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = await tryOnRequestSchema.validate(req.body);
      const user = this.getCurrentUser(req);

      const result = await this.tryOnService.createTryOn({
        itemId: body.itemId,
        userImageSrc: body.userImageSrc,
        lang: user.lang,
        userId: typeof user.id === 'number' ? user.id : null,
        clientIp: this.resolveClientIp(req),
      });

      if (result.code === 3) {
        const { httpStatus, ...payload } = result;
        if (!_.isNil(httpStatus)) {
          res.status(httpStatus).json(payload);
          return;
        }
        res.json(payload);
        return;
      }

      res.json(result);
    } catch (error) {
      this.errorHandler(error, res);
    }
  };

  /**
   * POST /api/integration/try-on/rating
   * @param req - Express request
   * @param res - Express response
   * @returns void
   */
  public setRating = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = await tryOnRatingSchema.validate(req.body);
      const user = this.getCurrentUser(req);

      const result = await this.tryOnService.setRating(
        body.tryOnLogId,
        body.rating as AiTryOnUserRatingEnum,
        user.lang,
      );

      res.json(result);
    } catch (error) {
      this.errorHandler(error, res);
    }
  };

  /**
   * IP клиента из request
   * @param req - request
   * @returns IP строка
   */
  private resolveClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && !_.isEmpty(forwarded)) {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || '0.0.0.0';
  };
}
