import cn from 'classnames';
import { useCallback, useState, type CSSProperties } from 'react';

import { isMediaSourceLoaded, markMediaSourceLoaded } from '@/themes/v2/components/mediaLoadCache';
import styles from '@/themes/v2/components/V2Image.module.scss';

type ProductGalleryVideoVariant = 'slide' | 'thumbnail';

export type ProductGalleryVideoProps = {
  src: string;
  variant: ProductGalleryVideoVariant;
  slideStyle?: CSSProperties;
  skeletonBorderRadius?: number | string;
};

/**
 * Видео-слайд/миниатюра галереи с solid-плейсхолдером до onLoadedData
 * @param src - URL видео
 * @param variant - slide (основной слайд) или thumbnail (превью)
 * @param slideStyle - инлайн-стили video для variant slide
 * @param skeletonBorderRadius - скругление слота плейсхолдера
 * @returns video с плейсхолдером загрузки
 */
export const ProductGalleryVideo = ({
  src,
  variant,
  slideStyle,
  skeletonBorderRadius = variant === 'thumbnail' ? 8 : 16,
}: ProductGalleryVideoProps) => {
  const [isLoading, setIsLoading] = useState(() => !isMediaSourceLoaded(src));

  /**
   * Снимает плейсхолдер после загрузки кадра видео
   */
  const handleLoadedData = useCallback(() => {
    markMediaSourceLoaded(src);
    setIsLoading(false);
  }, [src]);

  /**
   * Для уже буферизованного видео сразу снимает плейсхолдер
   * @param videoElement - DOM-элемент video
   */
  const assignVideoRef = useCallback(
    (videoElement: HTMLVideoElement | null) => {
      if (!videoElement || !isLoading) {
        return;
      }
      if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markMediaSourceLoaded(src);
        setIsLoading(false);
        return;
      }
      requestAnimationFrame(() => {
        if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          markMediaSourceLoaded(src);
          setIsLoading(false);
        }
      });
    },
    [isLoading, src],
  );

  const wrapStyle: CSSProperties = {
    borderRadius: typeof skeletonBorderRadius === 'number' ? `${skeletonBorderRadius}px` : skeletonBorderRadius,
  };

  const videoOpacityStyle: CSSProperties = {
    opacity: isLoading ? 0 : 1,
    transition: 'opacity 0.15s ease-out',
  };

  if (variant === 'thumbnail') {
    return (
      <span data-v2-image-slot className={cn(styles.wrap, styles.wrapFill)} style={wrapStyle}>
        {isLoading && (
          <span className={styles.solidPlaceholder} style={wrapStyle} aria-hidden />
        )}
        <video
          ref={assignVideoRef}
          className={cn('w-100', styles.imageLayer)}
          style={videoOpacityStyle}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          src={src}
          onLoadedData={handleLoadedData}
        />
      </span>
    );
  }

  return (
    <span data-v2-image-slot className={styles.wrap} style={wrapStyle}>
      {isLoading && (
        <span className={styles.solidPlaceholder} style={wrapStyle} aria-hidden />
      )}
      <video
        ref={assignVideoRef}
        className={cn('image-gallery-image', styles.imageLayer)}
        style={{ ...slideStyle, ...videoOpacityStyle }}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        src={src}
        onLoadedData={handleLoadedData}
      />
    </span>
  );
};
