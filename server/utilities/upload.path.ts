import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const uploadFilesPath = process.env.NODE_ENV === 'development'
  ? join(__dirname, '..', 'src', 'images')
  : join(__dirname, '..', '.next', 'static', 'media');
