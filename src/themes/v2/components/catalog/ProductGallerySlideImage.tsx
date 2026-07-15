import { memo, type CSSProperties, type ReactNode } from 'react';

import { V2Image } from '@/themes/v2/components/V2Image';

const GALLERY_ASPECT_RATIO = 1.3;

export type ProductGallerySlideImageProps = {
  src: string;
  alt: string;
  slideIndex: number;
  slideHeight: number;
  slideWidth: number | null;
  isFullscreen: boolean;
  isMobile: boolean;
  /** Опциональный оверлей (например бейдж AI) внутри image-gallery-image-wrap */
  children?: ReactNode;
};

/**
 * Стабильный слайд галереи (memo): solid-плейсхолдер и eager-loading для Safari
 */
export const ProductGallerySlideImage = memo(({
  src,
  alt,
  slideIndex,
  slideHeight,
  slideWidth,
  isFullscreen,
  isMobile,
  children,
}: ProductGallerySlideImageProps) => {
  const imageWidth = slideWidth ?? Math.round(slideHeight / GALLERY_ASPECT_RATIO);
  const useFillLayout = !isMobile;
  const inlineObjectFit = isMobile ? 'cover' : 'contain';

  const imageStyle: CSSProperties = useFillLayout
    ? {
      objectFit: isFullscreen ? 'contain' : 'cover',
      objectPosition: 'center',
    }
    : isFullscreen
      ? {
        width: '100%',
        maxWidth: '100%',
        maxHeight: 'calc(100svh - 72px)',
        height: 'auto',
        objectFit: 'contain',
        objectPosition: 'center',
      }
      : {
        width: '100%',
        maxHeight: slideHeight,
        objectFit: inlineObjectFit,
        objectPosition: 'center',
      };

  return (
    <span className="image-gallery-image-wrap">
      <V2Image
        key={src}
        src={src}
        alt={alt}
        className="image-gallery-image"
        showLoadingSkeleton
        loadingPlaceholder="solid"
        skeletonBorderRadius={isFullscreen ? 0 : 16}
        loading="eager"
        {...(useFillLayout
          ? {
            fill: true,
            sizes: isFullscreen ? '100vw' : '(max-width: 768px) 100vw, 560px',
          }
          : {
            width: imageWidth,
            height: slideHeight,
            sizes: isFullscreen ? '100vw' : '(max-width: 768px) 100vw, 560px',
          })}
        priority={slideIndex === 0}
        style={imageStyle}
      />
      {children}
    </span>
  );
});
ProductGallerySlideImage.displayName = 'ProductGallerySlideImage';
