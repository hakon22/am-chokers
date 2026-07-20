import { promises as fs } from 'fs';

import sharp from 'sharp';
import { Container, Singleton } from 'typescript-ioc';
import { v4 as uuid } from 'uuid';

import { BaseService } from '@server/services/app/base.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

@Singleton
export class TryOnResultImageService extends BaseService {
  private readonly TAG = 'TryOnResultImageService';

  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly resultImageMaxLongSide = 2048;

  private readonly resultJpegQuality = 85;

  /**
   * Сжимает результат примерки и сохраняет в public/try-on/{uuid}.jpeg
   * @param imageBuffer - исходный buffer результата
   * @returns относительный путь /try-on/{uuid}.jpeg и имя файла
   */
  public saveResultImage = async (
    imageBuffer: Buffer,
  ): Promise<{ imageSrc: string; imageName: string; }> => {
    this.uploadPathService.checkFolder(UploadPathEnum.TRY_ON, 0);

    const imageName = `${uuid()}.jpeg`;
    const absolutePath = this.uploadPathService.getUploadPath(UploadPathEnum.TRY_ON, 0, imageName);

    const compressedBuffer = await sharp(imageBuffer)
      .rotate()
      .resize({
        width: this.resultImageMaxLongSide,
        height: this.resultImageMaxLongSide,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: this.resultJpegQuality })
      .toBuffer();

    await fs.writeFile(absolutePath, compressedBuffer);

    const imageSrc = `/${UploadPathEnum.TRY_ON}/${imageName}`;
    this.loggerService.info(this.TAG, `Saved try-on result ${imageSrc}`);

    return { imageSrc, imageName };
  };
}
