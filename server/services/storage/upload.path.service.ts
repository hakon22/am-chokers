import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, renameSync, unlinkSync, readFile, writeFile } from 'fs';

import { Container, Singleton } from 'typescript-ioc';
import moment from 'moment';

import { routes } from '@/routes';
import { LoggerService } from '@server/services/app/logger.service';
import { UploadPathEnum } from '@server/utilities/enums/upload.path.enum';

@Singleton
export class UploadPathService {
  private readonly loggerService = Container.get(LoggerService);

  private dirname = dirname(fileURLToPath(import.meta.url));

  public uploadFilesPath = join(this.dirname, '..', '..', '..', 'public');

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
    case UploadPathEnum.COVER:
      path = fileName
        ? join(this.uploadFilesPath, UploadPathEnum.COVER, fileName)
        : join(this.uploadFilesPath, UploadPathEnum.COVER);
      break;
    }
    return path;
  };

  /** Собирает путь для вставки в браузер */
  public getUrlPath = (folder: UploadPathEnum, id = 0) => {
    let path: string;

    switch (folder) {
    case UploadPathEnum.TEMP:
      path = join(routes.page.base.homePage, UploadPathEnum.TEMP);
      break;
    case UploadPathEnum.ITEM:
      path = join(routes.page.base.homePage, UploadPathEnum.ITEM, id.toString());
      break;
    case UploadPathEnum.COMMENT:
      path = join(routes.page.base.homePage, UploadPathEnum.COMMENT, id.toString());
      break;
    case UploadPathEnum.COVER:
      path = join(routes.page.base.homePage, UploadPathEnum.COVER);
      break;
    }
    return path;
  };

  /** Проверяет наличие папки. В случае отсутствия - создаёт её */
  public checkFolder = (folder: UploadPathEnum, id: number) => {
    const path = this.getUploadPath(folder, id);
    if (!existsSync(path)) {
      mkdirSync(path);
    }
  };

  public moveFile = (folder: UploadPathEnum, id: number, fileName: string) => renameSync(this.getUploadPath(UploadPathEnum.TEMP, 0, fileName), this.getUploadPath(folder, id, fileName));

  public removeFile = (folder: UploadPathEnum, fileName: string, id?: number) => unlinkSync(this.getUploadPath(folder, id ?? 0, fileName));

  public createSitemap = (url: string, isItemGroup = false) => {
    const sitemapPath = join(this.uploadFilesPath, 'sitemap.xml');

    readFile(sitemapPath, 'utf8', (err, data) => {
      if (err) {
        this.loggerService.error('Ошибка чтения файла sitemap', err);
        return;
      }

      const lastmod = moment.utc().format('YYYY-MM-DDTHH:mm:ssZ');
      const newUrl = `<url>
  <loc>${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>${isItemGroup ? '0.80' : '0.64'}</priority>
</url>
`;

      const updatedSitemap = data.replace('</urlset>', `${newUrl}</urlset>`);

      writeFile(sitemapPath, updatedSitemap, 'utf8', (error) => {
        if (err) {
          this.loggerService.error('Ошибка записи в файл sitemap', error);
          return;
        }
        this.loggerService.info(`Sitemap успешно обновлён добавлением ${isItemGroup ? 'новой группы' : 'нового'} товара:`, `${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${url}`);
      });
    });
  };

  public updateSitemap = (oldUrl: string, newUrl: string, isItemGroup = false) => {
    const sitemapPath = join(this.uploadFilesPath, 'sitemap.xml');

    readFile(sitemapPath, 'utf8', (err, data) => {
      if (err) {
        this.loggerService.error('Ошибка чтения файла sitemap', err);
        return;
      }

      const newLastModTag = `  <lastmod>${moment.utc().format('YYYY-MM-DDTHH:mm:ssZ')}</lastmod>`;
      let updatedSitemap = data;
      let found = false;

      if (isItemGroup) {
      // Режим группового обновления: находим все ссылки, содержащие oldUrl
        const groupRegex = new RegExp(`<loc>(${process.env.NEXT_PUBLIC_PRODUCTION_HOST}.*?${oldUrl}.*?)</loc>\\s*<lastmod>.*?</lastmod>`, 'g');
      
        updatedSitemap = data.replace(groupRegex, (match, oldFullUrl) => {
          found = true;
          const newFullUrl = oldFullUrl.replace(oldUrl, newUrl);
          return `<loc>${newFullUrl}</loc>\n${newLastModTag}`;
        });
      } else {
      // Режим одиночного обновления
        const singleRegex = new RegExp(`<loc>${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${oldUrl}</loc>\\s*<lastmod>.*?</lastmod>`, 'g');
      
        if (singleRegex.test(data)) {
          found = true;
          const newLocTag = `<loc>${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${newUrl}</loc>`;
          updatedSitemap = data.replace(singleRegex, () => `${newLocTag}\n${newLastModTag}`);
        }
      }

      if (found) {
        writeFile(sitemapPath, updatedSitemap, 'utf8', (error) => {
          if (error) {
            this.loggerService.error('Ошибка записи в файл sitemap', error);
            return;
          }
          this.loggerService.info('Sitemap успешно обновлён', isItemGroup ? 
            `групповое изменение ссылок с "${oldUrl}" на "${newUrl}"` : 
            `изменение товара: ${process.env.NEXT_PUBLIC_PRODUCTION_HOST}${newUrl}`,
          );
        });
      } else {
        this.loggerService.error('Ссылка(и) не найдена(ы) в sitemap.');
      }
    });
  };
}
