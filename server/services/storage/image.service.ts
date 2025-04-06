import { writeFileSync } from 'fs';

import sharp from 'sharp';
import type { Request, Response } from 'express';
import { Container, Singleton } from 'typescript-ioc';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import type { EntityManager } from 'typeorm';

import { ImageEntity } from '@server/db/entities/image.entity';
import { BaseService } from '@server/services/app/base.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { paramsIdSchema, queryUploadImageParams } from '@server/utilities/convertation.params';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';
import { ItemEntity } from '@server/db/entities/item.entity';
import { CommentEntity } from '@server/db/entities/comment.entity';
import { setCoverImageValidation } from '@/validations/validations';
import type { ImageQueryInterface } from '@server/types/storage/image.query.interface';
import type { ParamsIdInterface } from '@server/types/params.id.interface';

@Singleton
export class ImageService extends BaseService {
  private readonly uploadPathService = Container.get(UploadPathService);

  private createQueryBuilder = (query?: ImageQueryInterface) => {
    const manager = this.databaseService.getManager();

    const builder = manager.createQueryBuilder(ImageEntity, 'image')
      .select([
        'image.id',
        'image.name',
        'image.path',
        'image.deleted',
        'image.coverOrder',
      ]);

    if (query?.withDeleted) {
      builder.withDeleted();
    }
    if (query?.id) {
      builder.andWhere('image.id = :id', { id: query.id });
    }
    if (query?.ids?.length) {
      builder.andWhere('image.id IN(:...ids)', { ids: query.ids });
    }
    if (query?.withItem) {
      builder
        .leftJoin('image.item', 'item')
        .addSelect('item.id');
    }

    return builder;
  };

  private findOne = async (query: ImageQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const image = await builder.getOne();

    if (!image) {
      throw new Error(`Изображения с номером #${query.id} не существует.`);
    }

    return image;
  };

  public findMany = async (query: ImageQueryInterface) => {
    const builder = this.createQueryBuilder(query);

    const images = await builder.getMany();

    return images;
  };

  public deleteOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const image = await this.findOne(params);

      await image.softRemove();

      res.json({ code: 1, image });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public restoreOne = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);

      const deletedImage = await this.findOne(params);

      const image = await deletedImage.recover();

      res.json({ code: 1, image });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public uploadHandler = async (req: Request, res: Response) => {
    try {
      const { file, query: reqQuery } = req;

      if (!file) {
        res.status(400).json({ code: 3, message: 'Изображение не найдено' });
        return;
      }

      const query = await queryUploadImageParams.validate(reqQuery);

      let maxWidth = 800; // максимальная ширина
      let maxHeight = Math.round(maxWidth * 1.3); // максимальная высота

      if (query.cover) {
        maxHeight = 460;
        maxWidth = Math.round(maxHeight * 2.2);
      } else if (query.coverCollection) {
        maxHeight = 299;
        maxWidth = Math.round(maxHeight * 1.505);
      }

      // Используем sharp для обработки изображения
      const data = await sharp(file.buffer)
        .resize({
          width: maxWidth,
          height: maxHeight,
          fit: sharp.fit.inside, // сохраняет пропорции
          withoutEnlargement: true, // не увеличивает изображение
        })
        .toFormat('jpeg')
        .toBuffer();

      const name = `${uuid()}.jpeg`;
      // Сохранение обработанного изображения
      const outputPath = this.uploadPathService.getUploadPath(UploadPathEnum.TEMP, 0, name);
      writeFileSync(outputPath, data);

      const image = await ImageEntity.save({
        name,
        path: this.uploadPathService.getUrlPath(UploadPathEnum.TEMP),
      });

      image.src = this.getSrc(image);

      res.json({ code: 1, image });
    } catch (e) {
      this.loggerService.error(e);
      res.status(500).json({ code: 2, message: 'Ошибка при обработке изображения' });
    }
  };

  public setCoverImage = async (req: Request, res: Response) => {
    try {
      const { id, coverOrder } = await setCoverImageValidation.serverValidator(req.body) as ParamsIdInterface & { coverOrder: number; };
  
      const image = await this.findOne({ id });

      this.uploadPathService.moveFile(UploadPathEnum.COVER, 0, image.name);

      image.path = this.uploadPathService.getUrlPath(UploadPathEnum.COVER);
      image.coverOrder = coverOrder;
  
      await image.save();

      image.src = this.getSrc(image);
  
      res.json({ code: 1, image });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public removeCoverImage = async (req: Request, res: Response) => {
    try {
      const params = await paramsIdSchema.validate(req.params);
  
      const image = await this.findOne(params);
  
      await ImageEntity.delete(image.id);

      this.uploadPathService.removeFile(UploadPathEnum.COVER, image.name);
  
      res.json({ code: 1, image });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public getCoverImages = async (req: Request, res: Response) => {
    try {
      const builder = this.createQueryBuilder()
        .where('image.coverOrder IS NOT NULL')
        .orderBy('image.coverOrder', 'ASC');
  
      const coverImages = await builder.getMany();
  
      res.json({ code: 1, coverImages });
    } catch (e) {
      this.errorHandler(e, res);
    }
  };

  public upload = () => {
    const storage = multer.memoryStorage();
    const upload = multer({ storage });

    return upload.single('file');
  };

  public processingImages = async (images: ImageEntity[], folder: UploadPathEnum, id: number, manager: EntityManager) => {
    if (!images?.length) {
      return;
    }
    const updatedImages = images.map((image, i) => {
      if (image.path === this.uploadPathService.getUrlPath(UploadPathEnum.TEMP)) {
        this.uploadPathService.moveFile(folder, id, image.name);
        image.path = this.uploadPathService.getUrlPath(folder, id);
        switch (folder) {
        case UploadPathEnum.ITEM:
          image.item = { id } as ItemEntity;
          break;
        case UploadPathEnum.COMMENT:
          image.comment = { id } as CommentEntity;
          break;
        }
      }
      image.order = i;
      return image;
    });
    await manager.getRepository(ImageEntity).save(updatedImages);
  };

  private getSrc = (image: ImageEntity) => [image.path, image.name].join('/').replaceAll('\\', '/');
}
