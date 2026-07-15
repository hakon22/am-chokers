import { createHash } from 'crypto';
import { promises as fs } from 'fs';

import _ from 'lodash';
import { Container, Singleton } from 'typescript-ioc';

import { BaseService } from '@server/services/app/base.service';
import { UploadPathService } from '@server/services/storage/upload.path.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

@Singleton
export class TryOnUserImageService extends BaseService {
  private readonly TAG = 'TryOnUserImageService';

  private readonly uploadPathService = Container.get(UploadPathService);

  private readonly deleteUserImageAfterRequest = true;

  /**
   * Проверяет и читает temp-файл пользователя
   * @param userImageSrc - относительный путь вида /temp/filename.jpeg
   * @returns buffer файла и имя файла
   */
  public readTempUserImage = async (userImageSrc: string): Promise<{ buffer: Buffer; fileName: string; }> => {
    if (!userImageSrc.startsWith('/temp/') && !userImageSrc.startsWith('temp/')) {
      throw new Error('userImageSrc must be a /temp/ path');
    }

    const fileName = userImageSrc.replace(/^\/?temp\//, '');
    if (_.isEmpty(fileName) || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      throw new Error('Invalid userImageSrc');
    }

    const absolutePath = this.uploadPathService.getUploadPath(UploadPathEnum.TEMP, 0, fileName);
    const buffer = await fs.readFile(absolutePath);
    return { buffer, fileName };
  };

  /**
   * Удаляет temp-файл после примерки (если включено)
   * @param fileName - имя файла в /temp/
   * @returns void
   */
  public deleteTempUserImage = async (fileName: string): Promise<void> => {
    if (!this.deleteUserImageAfterRequest) {
      return;
    }

    try {
      this.uploadPathService.removeFile(UploadPathEnum.TEMP, fileName);
      this.loggerService.info(this.TAG, `Deleted temp user image ${fileName}`);
    } catch (error) {
      this.loggerService.warn(this.TAG, `Failed to delete temp user image ${fileName}`, error);
    }
  };

  /**
   * Считает SHA-256 хеш IP с солью
   * @param ipAddress - IP клиента
   * @returns hex-хеш
   */
  public hashIpAddress = (ipAddress: string): string => {
    const salt = process.env.TRY_ON_IP_HASH_SALT;
    if (_.isEmpty(salt)) {
      throw new Error('TRY_ON_IP_HASH_SALT is required');
    }

    return createHash('sha256')
      .update(`${ipAddress}${salt}`)
      .digest('hex');
  };
}
