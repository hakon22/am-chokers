import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, renameSync } from 'fs';

import { Singleton } from 'typescript-ioc';

import { routes } from '@/routes';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';


@Singleton
export class UploadPathService {
  private dirname = dirname(fileURLToPath(import.meta.url));

  private uploadFilesPath = join(this.dirname, '..', '..', 'public');

  /** Собирает относительный путь для загрузки на сервер */
  public getUploadPath = (folder: UploadPathEnum, id: number, fileName = '') => {
    let path: string;

    switch (folder) {
    case UploadPathEnum.TEMP:
      path = join(this.uploadFilesPath, UploadPathEnum.TEMP, fileName);
      break;
    case UploadPathEnum.ITEM:
      path = fileName
        ? join(this.uploadFilesPath, UploadPathEnum.ITEM, id.toString(), fileName)
        : join(this.uploadFilesPath, UploadPathEnum.ITEM, id.toString());
      break;
    case UploadPathEnum.COMMENT:
      path = fileName
        ? join(this.uploadFilesPath, UploadPathEnum.COMMENT, id.toString(), fileName)
        : join(this.uploadFilesPath, UploadPathEnum.COMMENT, id.toString());
      break;
    }
    return path;
  };

  /** Собирает путь для вставки в браузер */
  public getUrlPath = (folder: UploadPathEnum, id = 0) => {
    let path: string;

    switch (folder) {
    case UploadPathEnum.TEMP:
      path = join(routes.homePage, UploadPathEnum.TEMP);
      break;
    case UploadPathEnum.ITEM:
      path = join(routes.homePage, UploadPathEnum.ITEM, id.toString());
      break;
    case UploadPathEnum.COMMENT:
      path = join(routes.homePage, UploadPathEnum.COMMENT, id.toString());
      break;
    }
    return path;
  };

  /** Проверяет наличие папки. В случае отсутствия - создаёт её */
  public checkFolder = (folder: UploadPathEnum, id: number) => {
    if (!existsSync(this.getUploadPath(folder, id))) {
      mkdirSync(this.getUploadPath(folder, id));
    }
  };

  public moveFile = (folder: UploadPathEnum, id: number, fileName: string) => renameSync(this.getUploadPath(UploadPathEnum.TEMP, 0, fileName), this.getUploadPath(folder, 0, fileName));
}
