import { Container, Singleton } from 'typescript-ioc';
import type { EntityManager } from 'typeorm';

import { BannerEntity } from '@server/db/entities/banner.entity';
import { ImageEntity } from '@server/db/entities/image.entity';
import { BaseService } from '@server/services/app/base.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { UserLangEnum } from '@server/types/user/enums/user.lang.enum';
import type { BannerOptionsInterface } from '@server/types/banner/banner.options.interface';
import type { BannerQueryInterface } from '@server/types/banner/banner.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class BannerService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private createQueryBuilder = (query?: BannerQueryInterface, options?: BannerOptionsInterface ) => {
    const manager = options?.manager || this.databaseService.getManager();

    const builder = manager.createQueryBuilder(BannerEntity, 'banner')
      .select([
        'banner.id',
        'banner.name',
        'banner.link',
        'banner.copyValue',
        'banner.order',
        'banner.deleted',
      ])
      .leftJoin('banner.desktopVideo', 'desktopVideo')
      .addSelect([
        'desktopVideo.id',
        'desktopVideo.name',
        'desktopVideo.path',
        'desktopVideo.deleted',
      ])
      .leftJoin('banner.mobileVideo', 'mobileVideo')
      .addSelect([
        'mobileVideo.id',
        'mobileVideo.name',
        'mobileVideo.path',
        'mobileVideo.deleted',
      ])
      .orderBy('banner.order', 'ASC');

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.excludeIds?.length) {
      builder.andWhere('banner.id NOT IN(:...excludeIds)', { excludeIds: query.excludeIds });
    }
    if (query?.includeIds?.length) {
      builder.andWhere('banner.id IN(:...includeIds)', { includeIds: query.includeIds });
    }

    return builder;
  };

  public findMany = async (query?: BannerQueryInterface, options?: BannerOptionsInterface) => {
    const builder = this.createQueryBuilder(query, options);
    return builder.getMany();
  };

  public createOne = async (body: BannerEntity, lang: UserLangEnum) => {
    const count = await BannerEntity.count({ withDeleted: true });
    body.order = count;

    const created = await this.databaseService.getManager().transaction(async (manager) => {
      const bannerRepo = manager.getRepository(BannerEntity);
      const desktopVideo = await this.resolveVideo(body.desktopVideo, lang, manager);
      const mobileVideo = await this.resolveVideo(body.mobileVideo, lang, manager);

      const banner = bannerRepo.create({
        ...body,
        desktopVideo,
        mobileVideo,
      });

      return bannerRepo.save(banner);
    });

    const banner = await this.findOne({ id: created.id }, lang, { withDeleted: true });

    return { code: 1, banner };
  };

  public updateOne = async (params: ParamsIdInterface, body: BannerEntity, lang: UserLangEnum) => {
    const banner = await this.findOne(params, lang, { withDeleted: true });

    const updated = await this.databaseService.getManager().transaction(async (manager) => {
      const bannerRepo = manager.getRepository(BannerEntity);

      const nextBanner = bannerRepo.create({
        ...banner,
        ...body,
      });

      if (body.desktopVideo?.id && body.desktopVideo.id !== banner.desktopVideo?.id) {
        nextBanner.desktopVideo = await this.resolveVideo(body.desktopVideo, lang, manager);
      }

      if (body.mobileVideo?.id && body.mobileVideo.id !== banner.mobileVideo?.id) {
        nextBanner.mobileVideo = await this.resolveVideo(body.mobileVideo, lang, manager);
      }

      await bannerRepo.save(nextBanner);

      return this.findOne(params, lang, { withDeleted: true }, { manager });
    });

    return { code: 1, banner: updated };
  };

  public deleteOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const banner = await this.findOne(params, lang, { withDeleted: true });

    await this.databaseService.getManager().transaction(async (manager) => {
      await manager.getRepository(BannerEntity).softRemove(banner);
    });

    return this.findOne(params, lang, { withDeleted: true });
  };

  public restoreOne = async (params: ParamsIdInterface, lang: UserLangEnum) => {
    const banner = await this.findOne(params, lang, { withDeleted: true });

    await this.databaseService.getManager().transaction(async (manager) => {
      await manager.getRepository(BannerEntity).recover(banner);
    });

    return this.findOne(params, lang, { withDeleted: true });
  };

  public reorder = async (body: { id: number; }[], query?: BannerQueryInterface) => {
    const updated: Pick<BannerEntity, 'id' | 'order'>[] = [];

    body.forEach(({ id }, order) => {
      updated.push({ id, order });
    });

    await BannerEntity.save(updated as BannerEntity[]);

    return this.findMany({ includeIds: body.map(({ id }) => id), ...query });
  };

  private findOne = async (params: ParamsIdInterface, lang: UserLangEnum, query?: BannerQueryInterface, options?: BannerOptionsInterface) => {
    const banner = await this.createQueryBuilder(query, options)
      .andWhere('banner.id = :id', { id: params.id })
      .getOne();

    if (!banner) {
      throw new Error(lang === UserLangEnum.RU
        ? `Баннера с номером #${params.id} не существует.`
        : `Banner with number #${params.id} does not exist.`);
    }

    return banner;
  };

  private moveVideo = async (video: ImageEntity, manager: EntityManager) => {
    const tempPath = this.uploadPathService.getUrlPath(UploadPathEnum.TEMP);
    if (video.path === tempPath) {
      this.uploadPathService.checkFolder(UploadPathEnum.BANNER, 0);
      this.uploadPathService.moveFile(UploadPathEnum.BANNER, 0, video.name);
      video.path = this.uploadPathService.getUrlPath(UploadPathEnum.BANNER);
      await manager.getRepository(ImageEntity).save(video);
    }

    return video;
  };

  private resolveVideo = async (video: ImageEntity, lang: UserLangEnum, manager: EntityManager) => {
    const repo = manager.getRepository(ImageEntity);
    const found = await repo.findOne({ where: { id: video.id }, withDeleted: true });
    if (!found) {
      throw new Error(lang === UserLangEnum.RU
        ? `Медиафайла с номером #${video.id} не существует.`
        : `Media file with number #${video.id} does not exist.`);
    }
    return this.moveVideo(found, manager);
  };
}
