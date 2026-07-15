import { resolveNextImageOptimizerWidth } from '@/utilities/resolveNextImageOptimizerWidth';

/** sizes слайда галереи PDP (как в ProductGallerySlideImage) */
export const PRODUCT_GALLERY_SLIDE_SIZES = '(max-width: 768px) 100vw, 560px';

/** sizes миниатюры галереи PDP */
export const PRODUCT_GALLERY_THUMBNAIL_SIZES = '96px';

/** SSR viewport для оценки preload на mobile (как V2ProductGallery) */
export const SSR_PRODUCT_GALLERY_MOBILE_VIEWPORT_WIDTH = 390;

/** SSR viewport для оценки preload на desktop (как V2ProductGallery) */
export const SSR_PRODUCT_GALLERY_DESKTOP_VIEWPORT_WIDTH = 1200;

/** SSR DPR для preload (типичный retina) */
export const SSR_PRODUCT_GALLERY_DEVICE_PIXEL_RATIO = 2;

/** Quality по умолчанию для next/image в проекте */
export const PRODUCT_GALLERY_PRELOAD_QUALITY = 75;

export type ProductGalleryOptimizerUrlOptions = {
  /** Ширина viewport в CSS px */
  viewportWidth: number;
  /** devicePixelRatio */
  devicePixelRatio: number;
};

/**
 * Собирает URL ответа Next Image Optimizer
 * @param imageSrc - путь к исходному файлу (например /items/.../file.jpg)
 * @param width - ширина из deviceSizes/imageSizes Next
 * @param quality - качество сжатия (из next.config images.qualities)
 * @returns относительный URL /_next/image?...
 */
export const buildNextImageOptimizerUrl = (
  imageSrc: string,
  width: number,
  quality: number = PRODUCT_GALLERY_PRELOAD_QUALITY,
): string => {
  const params = new URLSearchParams({
    url: imageSrc,
    w: String(width),
    q: String(quality),
  });

  return `/_next/image?${params.toString()}`;
};

/**
 * Viewport/DPR для клиентского прогрева (window) или SSR-оценки
 * @param options - явные viewport/DPR; иначе window / SSR desktop defaults
 * @returns viewportWidth и devicePixelRatio
 */
const resolveOptimizerViewportOptions = (options?: Partial<ProductGalleryOptimizerUrlOptions>): ProductGalleryOptimizerUrlOptions => {
  if (options?.viewportWidth !== undefined && options.devicePixelRatio !== undefined) {
    return {
      viewportWidth: options.viewportWidth,
      devicePixelRatio: options.devicePixelRatio,
    };
  }

  if (typeof window !== 'undefined') {
    return {
      viewportWidth: options?.viewportWidth ?? window.innerWidth,
      devicePixelRatio: options?.devicePixelRatio ?? (window.devicePixelRatio || 1),
    };
  }

  return {
    viewportWidth: options?.viewportWidth ?? SSR_PRODUCT_GALLERY_DESKTOP_VIEWPORT_WIDTH,
    devicePixelRatio: options?.devicePixelRatio ?? SSR_PRODUCT_GALLERY_DEVICE_PIXEL_RATIO,
  };
};

/**
 * Optimizer-URL слайда галереи для preload / прогрева
 * @param imageSrc - путь к исходному файлу
 * @param options - viewport и DPR для выбора w
 * @returns /_next/image?...&w=…&q=75
 */
export const buildProductGallerySlideOptimizerUrl = (
  imageSrc: string,
  options?: Partial<ProductGalleryOptimizerUrlOptions>,
): string => {
  const { viewportWidth, devicePixelRatio } = resolveOptimizerViewportOptions(options);
  const width = resolveNextImageOptimizerWidth({
    sizes: PRODUCT_GALLERY_SLIDE_SIZES,
    viewportWidth,
    devicePixelRatio,
  });

  return buildNextImageOptimizerUrl(imageSrc, width);
};

/**
 * Optimizer-URL миниатюры галереи для прогрева
 * @param imageSrc - путь к исходному файлу
 * @param options - viewport и DPR для выбора w
 * @returns /_next/image?...&w=…&q=75
 */
export const buildProductGalleryThumbnailOptimizerUrl = (
  imageSrc: string,
  options?: Partial<ProductGalleryOptimizerUrlOptions>,
): string => {
  const { viewportWidth, devicePixelRatio } = resolveOptimizerViewportOptions(options);
  const width = resolveNextImageOptimizerWidth({
    sizes: PRODUCT_GALLERY_THUMBNAIL_SIZES,
    viewportWidth,
    devicePixelRatio,
  });

  return buildNextImageOptimizerUrl(imageSrc, width);
};
