import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { routes } from '@/routes';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const uploadFilesPath = join(__dirname, '..', '..', 'public');
export const uploadFilesTempPath = (fileName: string) => join(uploadFilesPath, 'temp', fileName);
export const uploadFilesItemPath = (id: number, fileName?: string) => fileName ? join(uploadFilesPath, 'items', id.toString(), fileName) : join(uploadFilesPath, 'items', id.toString());
export const tempPath = join(routes.homePage, 'temp');
export const itemPath = (id: number) => join(routes.homePage, 'items', id.toString());
