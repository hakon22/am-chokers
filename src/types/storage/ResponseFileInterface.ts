import type { ImageEntity } from '@server/db/entities/image.entity';

export interface ResponseFileInterface {
  code: number;
  message: string;
  image: ImageEntity;
}
