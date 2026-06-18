import { Skeleton } from 'antd';
import cn from 'classnames';
import Image from 'next/image';
import {
  forwardRef,
  useCallback,
  useState,
  type ComponentProps,
  type CSSProperties,
  type SyntheticEvent,
} from 'react';

import { getMediaSourceKey, isMediaSourceLoaded, markMediaSourceLoaded } from '@/themes/v2/components/mediaLoadCache';
import styles from '@/themes/v2/components/V2Image.module.scss';

export type V2ImageLoadingPlaceholder = 'skeleton' | 'solid';

export type V2ImageProps = ComponentProps<typeof Image> & {
  /** Показывать плейсхолдер до события onLoad */
  showLoadingSkeleton?: boolean;
  /** Скругление слота плейсхолдера и обёртки (px или CSS-значение) */
  skeletonBorderRadius?: number | string;
  /** skeleton — antd; solid — фон темы без белой вспышки (галерея, Safari) */
  loadingPlaceholder?: V2ImageLoadingPlaceholder;
};

type V2ImageSkeletonWrapProps = Omit<V2ImageProps, 'showLoadingSkeleton'> & {
  showLoadingSkeleton: true;
};

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
    ...rest
  }, ref) => {
    const sourceKey = getMediaSourceKey(src);
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
     * Пробрасывает ref наружу; для кэшированных img сразу снимает плейсхолдер
     * @param node - DOM-элемент img
     */
    const assignImageRef = useCallback(
      (node: HTMLImageElement | null) => {
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
        if (!node || !isLoading) {
          return;
        }
        tryFinishLoadingFromImageElement(node, finishLoading);
        requestAnimationFrame(() => {
          tryFinishLoadingFromImageElement(node, finishLoading);
        });
      },
      [finishLoading, isLoading, ref],
    );

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        if (!unoptimized && !optimizerFailed) {
          setOptimizerFailed(true);
          return;
        }
        onError?.(event);
      },
      [unoptimized, optimizerFailed, onError],
    );

    /**
     * Снимает плейсхолдер и пробрасывает onLoad наружу
     * @param event - событие загрузки img
     */
    const handleLoad = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        finishLoading();
        onLoad?.(event);
      },
      [finishLoading, onLoad],
    );

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
          src={src}
          ref={assignImageRef}
          alt={alt ?? ''}
          fill={fill}
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
    ...rest
  }, ref) => {
    const [optimizerFailed, setOptimizerFailed] = useState(false);
    const useDirect = Boolean(unoptimized || optimizerFailed);

    const handleError = useCallback(
      (event: SyntheticEvent<HTMLImageElement, Event>) => {
        if (!unoptimized && !optimizerFailed) {
          setOptimizerFailed(true);
          return;
        }
        onError?.(event);
      },
      [unoptimized, optimizerFailed, onError],
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
          showLoadingSkeleton
          skeletonBorderRadius={skeletonBorderRadius}
          loadingPlaceholder={loadingPlaceholder}
          fill={fill}
          className={className}
          style={style}
          src={src}
          {...rest}
        />
      );
    }

    return (
      <Image
        {...rest}
        src={src}
        ref={ref}
        alt={alt ?? ''}
        fill={fill}
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
