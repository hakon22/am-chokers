import { memo } from 'react';

import { V2Image } from '@/themes/v2/components/V2Image';

const GALLERY_THUMBNAIL_SIZE = 96;

export type ProductGalleryThumbnailImageProps = {
  src: string;
  alt: string;
};

/**
 * Стабильная миниатюра галереи (memo): solid-плейсхолдер и eager-loading для Safari
 */
export const ProductGalleryThumbnailImage = memo(({ src, alt }: ProductGalleryThumbnailImageProps) => (
  <V2Image
    key={src}
    src={src}
    alt={alt}
    className="image-gallery-thumbnail-image"
    width={GALLERY_THUMBNAIL_SIZE}
    height={GALLERY_THUMBNAIL_SIZE}
    sizes="96px"
    showLoadingSkeleton
    loadingPlaceholder="solid"
    skeletonBorderRadius={8}
    loading="eager"
    style={{ objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%' }}
  />
));
ProductGalleryThumbnailImage.displayName = 'ProductGalleryThumbnailImage';
