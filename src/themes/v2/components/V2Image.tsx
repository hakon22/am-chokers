import { Skeleton } from 'antd';
import cn from 'classnames';
import Image from 'next/image';
import {
  forwardRef,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';

import { getMediaSourceKey, isMediaSourceLoaded, markMediaSourceLoaded } from '@/themes/v2/components/mediaLoadCache';
import styles from '@/themes/v2/components/V2Image.module.scss';
import { resolveImageLoading } from '@/utilities/resolveImageLoading';

export type V2ImageLoadingPlaceholder = 'skeleton' | 'solid';

export type V2ImageProps = ComponentProps<typeof Image> & {
  /** Показывать плейсхолдер до события onLoad */
  showLoadingSkeleton?: boolean;
  /** Скругление слота плейсхолдера и обёртки (px или CSS-значение) */
  skeletonBorderRadius?: number | string;
  /** skeleton — antd; solid — фон темы без белой вспышки (галерея, Safari) */
  loadingPlaceholder?: V2ImageLoadingPlaceholder;
};

type V2ImageSkeletonWrapProps = Omit<V2ImageProps, 'showLoadingSkeleton'>;

/** Интервал poll watchdog, пока optimizer ещё грузится */
const OPTIMIZER_FALLBACK_POLL_MS = 1000;

/** Принудительный fallback, если за это время нет декодированной картинки */
const OPTIMIZER_FALLBACK_MAX_WAIT_MS = 5000;

/**
 * Проверяет, что img всё ещё грузится через /_next/image
 * @param imageElement - DOM img
 * @returns true, если currentSrc указывает на оптимизатор Next.js
 */
const imageUsesNextOptimizerUrl = (imageElement: HTMLImageElement): boolean => (
  imageElement.currentSrc.includes('/_next/image')
);

/**
 * Пытается снять плейсхолдер для уже загруженного или декодированного img (Safari)
 * @param imageElement - DOM img
 * @param finishLoading - колбэк завершения загрузки
 */
const tryFinishLoadingFromImageElement = (imageElement: HTMLImageElement | null, finishLoading: () => void): void => {
  if (!imageElement) {
    return;
  }
  if (imageElement.complete && imageElement.naturalWidth > 0) {
    finishLoading();
    return;
  }
  if (typeof imageElement.decode === 'function') {
    imageElement.decode().then(finishLoading).catch(() => undefined);
  }
};

/**
 * Внутренняя обёртка с плейсхолдером; повторно не показывает его для уже загруженного src
 */
const V2ImageSkeletonWrap = forwardRef<HTMLImageElement, V2ImageSkeletonWrapProps>(
  ({
    onError,
    onLoad,
    unoptimized,
    alt,
    skeletonBorderRadius,
    loadingPlaceholder = 'skeleton',
    fill,
    className,
    style,
    src,
    priority,
    loading,
    ...rest
  }, ref) => {
    const resolvedLoading = resolveImageLoading(priority, loading);
    const sourceKey = getMediaSourceKey(src);
    const imageElementRef = useRef<HTMLImageElement | null>(null);
    const [optimizerFailed, setOptimizerFailed] = useState(false);
    const [isLoading, setIsLoading] = useState(() => !isMediaSourceLoaded(sourceKey));
    const useDirect = Boolean(unoptimized || optimizerFailed);

    /**
     * Отмечает источник загруженным и скрывает плейсхолдер
     */
    const finishLoading = useCallback(() => {
      if (!isMediaSourceLoaded(sourceKey)) {
        markMediaSourceLoaded(sourceKey);
      }
      setIsLoading(false);
    }, [sourceKey]);

    /**
     * Переключает загрузку на прямой URL (unoptimized) и показывает плейсхолдер на время retry
     */
    const beginOptimizerFallback = useCallback(() => {
      setOptimizerFailed(true);
      setIsLoading(true);
    }, []);

    /**
     * Пробрасывает ref наружу и проверяет готовность img (в т.ч. при cache hit)
     * @param node - DOM-элемент img
     */
    const assignImageRef = useCallback(
      (node: HTMLImageElement | null) => {
        imageElementRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        if (!node) {
          return;
        }
        if (node.complete && node.naturalWidth > 0) {
          finishLoading();
          return;
        }
        if (isMediaSourceLoaded(sourceKey) && node.naturalWidth === 0) {
          setIsLoading(true);
        }
        tryFinishLoadingFromImageElement(node, finishLoading);
        requestAnimationFrame(() => {
          tryFinishLoadingFromImageElement(node, finishLoading);
        });
      },
      [finishLoading, ref, sourceKey],
    );

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        if (!unoptimized && !optimizerFailed) {
          beginOptimizerFallback();
          return;
        }
        onError?.(event);
      },
      [beginOptimizerFallback, onError, optimizerFailed, unoptimized],
    );

    /**
     * Снимает плейсхолдер и пробрасывает onLoad наружу
     * @param event - событие загрузки img
     */
    const handleLoad = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        const { currentTarget } = event;
        if (currentTarget.naturalWidth > 0) {
          finishLoading();
        }
        onLoad?.(event);
      },
      [finishLoading, onLoad],
    );

    useLayoutEffect(() => {
      if (unoptimized || optimizerFailed) {
        return undefined;
      }

      const startedAt = Date.now();
      let pollTimeoutId = 0;

      /**
       * Проверяет img optimizer: finish, fallback при ошибке или по таймауту, иначе poll
       */
      const runOptimizerFallbackWatchdog = (): void => {
        const imageElement = imageElementRef.current;

        if (imageElement && imageElement.naturalWidth > 0) {
          finishLoading();
          return;
        }

        if (imageElement && imageUsesNextOptimizerUrl(imageElement)) {
          const elapsedMilliseconds = Date.now() - startedAt;
          const optimizerLoadFailed = imageElement.complete && imageElement.naturalWidth === 0;
          const optimizerWaitExceeded = elapsedMilliseconds >= OPTIMIZER_FALLBACK_MAX_WAIT_MS;

          if (optimizerLoadFailed || optimizerWaitExceeded) {
            beginOptimizerFallback();
            return;
          }
        }

        pollTimeoutId = window.setTimeout(runOptimizerFallbackWatchdog, OPTIMIZER_FALLBACK_POLL_MS);
      };

      pollTimeoutId = window.setTimeout(runOptimizerFallbackWatchdog, OPTIMIZER_FALLBACK_POLL_MS);

      return () => {
        clearTimeout(pollTimeoutId);
      };
    }, [beginOptimizerFallback, finishLoading, optimizerFailed, sourceKey, unoptimized]);

    useLayoutEffect(() => {
      if (!isLoading) {
        return undefined;
      }

      let layoutAnimationFrame = 0;
      const verifyLoadingAfterLayout = () => {
        layoutAnimationFrame = requestAnimationFrame(() => {
          tryFinishLoadingFromImageElement(imageElementRef.current, finishLoading);
        });
      };

      verifyLoadingAfterLayout();
      return () => {
        cancelAnimationFrame(layoutAnimationFrame);
      };
    }, [finishLoading, isLoading, useDirect]);

    const wrapStyle: CSSProperties | undefined = skeletonBorderRadius !== undefined
      ? { borderRadius: typeof skeletonBorderRadius === 'number' ? `${skeletonBorderRadius}px` : skeletonBorderRadius }
      : undefined;

    const imageStyle: CSSProperties = {
      ...(typeof style === 'object' ? style : {}),
      opacity: isLoading ? 0 : 1,
      transition: 'opacity 0.15s ease-out',
    };

    return (
      <span
        data-v2-image-slot
        className={cn(styles.wrap, fill && styles.wrapFill)}
        style={wrapStyle}
      >
        {isLoading && loadingPlaceholder === 'skeleton' && (
          <Skeleton.Image
            active
            className={styles.skeleton}
            classNames={{ content: 'w-100 h-100' }}
            style={wrapStyle}
          />
        )}
        {isLoading && loadingPlaceholder === 'solid' && (
          <span className={styles.solidPlaceholder} style={wrapStyle} aria-hidden />
        )}
        <Image
          {...rest}
          key={useDirect ? 'direct' : 'optimized'}
          src={src}
          ref={assignImageRef}
          alt={alt ?? ''}
          fill={fill}
          priority={priority}
          loading={resolvedLoading}
          unoptimized={useDirect}
          className={cn(className, styles.imageLayer)}
          style={imageStyle}
          onError={handleError}
          onLoad={handleLoad}
        />
      </span>
    );
  },
);
V2ImageSkeletonWrap.displayName = 'V2ImageSkeletonWrap';

/**
 * Обёртка над next/image: при сбое оптимизатора повторяет загрузку без /_next/image;
 * опционально — плейсхолдер до onLoad.
 */
export const V2Image = forwardRef<HTMLImageElement, V2ImageProps>(
  ({
    onError,
    onLoad,
    unoptimized,
    alt,
    showLoadingSkeleton = false,
    skeletonBorderRadius,
    loadingPlaceholder,
    fill,
    className,
    style,
    src,
    priority,
    loading,
    ...rest
  }, ref) => {
    const resolvedLoading = resolveImageLoading(priority, loading);
    const [optimizerFailed, setOptimizerFailed] = useState(false);
    const useDirect = Boolean(unoptimized || optimizerFailed);

    /**
     * Переключает на прямой URL при ошибке оптимизатора
     */
    const beginOptimizerFallback = useCallback(() => {
      setOptimizerFailed(true);
    }, []);

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        if (!unoptimized && !optimizerFailed) {
          beginOptimizerFallback();
          return;
        }
        onError?.(event);
      },
      [beginOptimizerFallback, onError, optimizerFailed, unoptimized],
    );

    if (showLoadingSkeleton) {
      const sourceKey = getMediaSourceKey(src);
      return (
        <V2ImageSkeletonWrap
          key={sourceKey}
          ref={ref}
          onError={onError}
          onLoad={onLoad}
          unoptimized={unoptimized}
          alt={alt}
          skeletonBorderRadius={skeletonBorderRadius}
          loadingPlaceholder={loadingPlaceholder}
          fill={fill}
          className={className}
          style={style}
          src={src}
          priority={priority}
          loading={loading}
          {...rest}
        />
      );
    }

    return (
      <Image
        {...rest}
        key={useDirect ? 'direct' : 'optimized'}
        src={src}
        ref={ref}
        alt={alt ?? ''}
        fill={fill}
        priority={priority}
        loading={resolvedLoading}
        unoptimized={useDirect}
        className={className}
        style={style}
        onError={handleError}
        onLoad={onLoad}
      />
    );
  },
);

V2Image.displayName = 'V2Image';
