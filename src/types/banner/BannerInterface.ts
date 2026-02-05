import type { OmitBase } from '@/types/OmitBase';
import type { BannerEntity } from '@server/db/entities/banner.entity';

export type BannerInterface = OmitBase<BannerEntity>;

export interface BannerResponseInterface {
  code: number;
  banner: BannerInterface;
}

export interface BannerListResponseInterface {
  code: number;
  banners: BannerInterface[];
}
