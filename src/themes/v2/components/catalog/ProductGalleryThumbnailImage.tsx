import { memo } from 'react';

import { V2Image } from '@/themes/v2/components/V2Image';

export type ProductGalleryThumbnailImageProps = {
  src: string;
  alt: string;
};

/**
 * Стабильная миниатюра галереи (memo): solid-плейсхолдер и eager-loading для Safari
 */
export const ProductGalleryThumbnailImage = memo(({ src, alt }: ProductGalleryThumbnailImageProps) => (
  <span className="image-gallery-thumbnail-inner">
    <V2Image
      src={src}
      alt={alt}
      className="image-gallery-thumbnail-image"
      fill
      sizes="96px"
      showLoadingSkeleton
      loadingPlaceholder="solid"
      skeletonBorderRadius={8}
      loading="eager"
      style={{ objectFit: 'cover', objectPosition: 'center' }}
    />
  </span>
));
ProductGalleryThumbnailImage.displayName = 'ProductGalleryThumbnailImage';
