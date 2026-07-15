import { isNil } from 'lodash';

/** Дефолтные deviceSizes Next.js (next.config без переопределения) */
export const NEXT_IMAGE_DEVICE_SIZES = [640, 750, 828, 1080, 1200, 1920, 2048, 3840] as const;

/** Дефолтные imageSizes Next.js (next.config без переопределения) */
export const NEXT_IMAGE_IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384] as const;

const NEXT_IMAGE_SRCSET_WIDTHS = [...NEXT_IMAGE_IMAGE_SIZES, ...NEXT_IMAGE_DEVICE_SIZES]
  .slice()
  .sort((a, b) => a - b);

export type ResolveNextImageOptimizerWidthParams = {
  /** Атрибут sizes, как у next/image */
  sizes: string;
  /** Ширина viewport в CSS px */
  viewportWidth: number;
  /** devicePixelRatio устройства */
  devicePixelRatio: number;
};

/**
 * Переводит CSS-длину sizes (px/vw) в пиксели
 * @param length - фрагмент вроде 560px или 100vw
 * @param viewportWidth - ширина viewport в CSS px
 * @returns ширина в CSS px или null, если формат неизвестен
 */
export const resolveCssLengthToPixels = (length: string, viewportWidth: number): number | null => {
  const trimmedLength = length.trim();
  const viewportMatch = trimmedLength.match(/^(\d+(?:\.\d+)?)vw$/i);
  if (viewportMatch) {
    return (Number(viewportMatch[1]) / 100) * viewportWidth;
  }

  const pixelMatch = trimmedLength.match(/^(\d+(?:\.\d+)?)px$/i);
  if (pixelMatch) {
    return Number(pixelMatch[1]);
  }

  return null;
};

/**
 * Вычисляет ширину слота изображения из sizes при данном viewport
 * @param sizes - атрибут sizes (поддерживаются max-width/min-width в px и fallback)
 * @param viewportWidth - ширина viewport в CSS px
 * @returns ширина слота в CSS px
 */
export const resolveSizesAttributeToLayoutWidth = (sizes: string, viewportWidth: number): number => {
  const candidates = sizes.split(',').map((candidate) => candidate.trim()).filter(Boolean);

  for (const candidate of candidates) {
    const mediaMatch = candidate.match(/^\((max-width|min-width):\s*(\d+)px\)\s+(.+)$/i);
    if (mediaMatch) {
      const mediaType = mediaMatch[1].toLowerCase();
      const breakpointPixels = Number(mediaMatch[2]);
      const length = mediaMatch[3];
      const mediaMatches = mediaType === 'max-width'
        ? viewportWidth <= breakpointPixels
        : viewportWidth >= breakpointPixels;

      if (!mediaMatches) {
        continue;
      }

      const layoutWidth = resolveCssLengthToPixels(length, viewportWidth);
      if (!isNil(layoutWidth)) {
        return layoutWidth;
      }
      continue;
    }

    const layoutWidth = resolveCssLengthToPixels(candidate, viewportWidth);
    if (!isNil(layoutWidth)) {
      return layoutWidth;
    }
  }

  return viewportWidth;
};

/**
 * Подбирает w для /_next/image как браузер из srcset (наименьший >= layoutWidth * dpr)
 * @param params - sizes, viewport и DPR
 * @returns ширина из imageSizes/deviceSizes Next
 */
export const resolveNextImageOptimizerWidth = ({
  sizes,
  viewportWidth,
  devicePixelRatio,
}: ResolveNextImageOptimizerWidthParams): number => {
  const safeViewportWidth = Math.max(1, viewportWidth);
  const safeDevicePixelRatio = Math.max(1, devicePixelRatio);
  const layoutWidth = resolveSizesAttributeToLayoutWidth(sizes, safeViewportWidth);
  const targetWidth = Math.ceil(layoutWidth * safeDevicePixelRatio);

  const matchedWidth = NEXT_IMAGE_SRCSET_WIDTHS.find((width) => width >= targetWidth);
  if (!isNil(matchedWidth)) {
    return matchedWidth;
  }

  return NEXT_IMAGE_SRCSET_WIDTHS[NEXT_IMAGE_SRCSET_WIDTHS.length - 1];
};
