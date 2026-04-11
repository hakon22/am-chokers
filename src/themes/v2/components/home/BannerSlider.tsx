import Link from 'next/link';
import type { MutableRefObject } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useTranslation } from 'react-i18next';
import Carousel, { type DotProps } from 'react-multi-carousel';
import type {
  ButtonGroupProps,
  CarouselInternalState,
} from 'react-multi-carousel/lib/types';
import { Skeleton } from 'antd';
import cn from 'classnames';
import { isEmpty, isNil } from 'lodash';
import 'react-multi-carousel/lib/styles.css';

import { MobileContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import styles from '@/themes/v2/components/home/BannerSlider.module.scss';
import { V2Image, type V2ImageProps } from '@/themes/v2/components/V2Image';
import type { BannerInterface } from '@/types/banner/BannerInterface';

const responsiveStrip = {
  desktop: { breakpoint: { max: 5000, min: 1200 }, items: 3, partialVisibilityGutter: 0 },
  tablet: { breakpoint: { max: 1199, min: 768 }, items: 2, partialVisibilityGutter: 40 },
  mobile: { breakpoint: { max: 767, min: 0 }, items: 1, partialVisibilityGutter: 48 },
};

const responsiveHero = {
  hero: { breakpoint: { max: 10000, min: 0 }, items: 1, partialVisibilityGutter: 0 },
};

const BANNER_VIDEO_POSTER_MAX_SIDE = 960;
const BANNER_AUTOPLAY_START_DELAY_MS = 1500;
const BANNER_IMAGE_DWELL_MS = 5000;

const schedulePosterPaint = (video: HTMLVideoElement, fn: () => void) => {
  const v = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number;
  };
  if (typeof v.requestVideoFrameCallback === 'function') {
    v.requestVideoFrameCallback(() => {
      requestAnimationFrame(fn);
    });
    return;
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
};

type StaticPosterLoad = 'checking' | 'ok' | 'bad';

/**
 * Таблица соответствия индекса в треке с клонами (infinite) и индекса оригинального слайда.
 * Логика совпадает с `getOriginalIndexLookupTableByClones` в react-multi-carousel.
 */
const buildOriginalIndexLookupTable = (
  slidesToShow: number,
  childrenCount: number,
): Record<number, number> => {
  if (childrenCount > 2 * slidesToShow) {
    const table: Record<number, number> = {};
    const firstBeginningOfClones = childrenCount - 2 * slidesToShow;
    const firstEndOfClones = childrenCount - firstBeginningOfClones;
    let firstCount = firstBeginningOfClones;
    for (let index = 0; index < firstEndOfClones; index += 1) {
      table[index] = firstCount;
      firstCount += 1;
    }
    const secondBeginningOfClones = childrenCount + firstEndOfClones;
    const secondEndOfClones =
      secondBeginningOfClones
      + Math.min(2 * slidesToShow, childrenCount);
    let secondCount = 0;
    for (
      let index = secondBeginningOfClones;
      index <= secondEndOfClones;
      index += 1
    ) {
      table[index] = secondCount;
      secondCount += 1;
    }
    const originalEnd = secondBeginningOfClones;
    let originalCounter = 0;
    for (let index = firstEndOfClones; index < originalEnd; index += 1) {
      table[index] = originalCounter;
      originalCounter += 1;
    }
    return table;
  }
  const table: Record<number, number> = {};
  const totalSlides = 3 * childrenCount;
  let count = 0;
  for (let index = 0; index < totalSlides; index += 1) {
    table[index] = count;
    if (++count === childrenCount) {
      count = 0;
    }
  }
  return table;
};

const mapCarouselSlideToOriginalIndex = (state: CarouselInternalState, childrenCount: number): number => {
  if (childrenCount <= 1) {
    return 0;
  }
  const { slidesToShow, totalItems, currentSlide } = state;
  if (!slidesToShow || totalItems < slidesToShow) {
    return Math.min(Math.max(currentSlide, 0), childrenCount - 1);
  }
  const table = buildOriginalIndexLookupTable(slidesToShow, childrenCount);
  const mapped = table[currentSlide];
  if (typeof mapped === 'number') {
    return mapped;
  }
  return currentSlide % childrenCount;
};

/**
 * Стор без React setState в родителе карусели: иначе лишний рендер родителя
 * снимает inline transition с трека сразу после `correctClonesPosition` (infinite),
 * и анимация пропадает при переходе с последнего слайда к первому.
 */
type BannerActiveSlideStore = {
  getSnapshot: () => number;
  notifyCarouselState: (state: CarouselInternalState, childrenCount: number) => void;
  subscribe: (onStoreChange: () => void) => () => void;
};

const createBannerActiveSlideStore = (): BannerActiveSlideStore => {
  let activeOriginalIndex = 0;
  const listeners = new Set<() => void>();
  return {
    subscribe: (onStoreChange) => {
      listeners.add(onStoreChange);
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    getSnapshot: () => activeOriginalIndex,
    notifyCarouselState: (carouselState, childrenCount) => {
      const nextIndex =
        childrenCount <= 0
          ? 0
          : mapCarouselSlideToOriginalIndex(carouselState, childrenCount);
      if (nextIndex !== activeOriginalIndex) {
        activeOriginalIndex = nextIndex;
        listeners.forEach((listener) => {
          listener();
        });
      }
    },
  };
};

type BannerCarouselStateBridgeProps = ButtonGroupProps & {
  advanceRef: MutableRefObject<(() => void) | null>;
  activeSlideStore: BannerActiveSlideStore;
  sortedLength: number;
};

const BannerCarouselStateBridge = ({
  advanceRef,
  activeSlideStore,
  carouselState,
  next,
  sortedLength,
}: BannerCarouselStateBridgeProps) => {
  useEffect(() => {
    if (isNil(next)) {
      advanceRef.current = null;
      return () => {
        advanceRef.current = null;
      };
    }
    advanceRef.current = () => {
      next();
    };
    return () => {
      advanceRef.current = null;
    };
  }, [advanceRef, next]);

  useEffect(() => {
    if (isNil(carouselState)) {
      return;
    }
    activeSlideStore.notifyCarouselState(carouselState, sortedLength);
  }, [
    activeSlideStore,
    carouselState,
    sortedLength,
    carouselState?.currentSlide,
    carouselState?.slidesToShow,
    carouselState?.totalItems,
    carouselState?.domLoaded,
    carouselState?.itemWidth,
    carouselState?.containerWidth,
  ]);
  return <div className={styles.carouselStateBridge} aria-hidden />;
};

/**
 * Превью: 1) JPEG с сервера (`*.poster.jpg`, тот же origin/path — без CORS для <img>).
 * 2) Если файла нет (старые баннеры) — кадр через canvas (часто ломается на чужом CDN из‑за CORS у drawImage).
 */
const BannerVideo = ({
  src,
  staticPosterUrl,
  objectFit = 'cover',
  posterSizes,
  isActive,
  shouldLoopVideo,
  onPlaybackComplete,
}: {
  src: string;
  staticPosterUrl: string;
  objectFit?: 'cover' | 'contain';
  posterSizes?: V2ImageProps['sizes'];
  isActive: boolean;
  shouldLoopVideo: boolean;
  onPlaybackComplete?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterBlobUrlRef = useRef<string | null>(null);
  const [staticPoster, setStaticPoster] = useState<StaticPosterLoad>('checking');
  const [blobPosterUrl, setBlobPosterUrl] = useState<string | null>(null);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const staticPosterImgRef = useRef<HTMLImageElement>(null);
  const isActiveRef = useRef(isActive);
  const wasActiveRef = useRef(false);

  useLayoutEffect(() => {
    isActiveRef.current = isActive;
  }, [isActive]);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }
    let cancelled = false;
    const onReady = () => {
      if (!cancelled) {
        setVideoCanPlay(true);
      }
    };
    const onError = () => {
      if (!cancelled) {
        setVideoCanPlay(true);
      }
    };
    video.addEventListener('canplay', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplaythrough', onReady);
    video.addEventListener('playing', onReady);
    video.addEventListener('error', onError);
    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      queueMicrotask(() => {
        if (!cancelled) {
          setVideoCanPlay(true);
        }
      });
    }
    return () => {
      cancelled = true;
      video.removeEventListener('canplay', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplaythrough', onReady);
      video.removeEventListener('playing', onReady);
      video.removeEventListener('error', onError);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoCanPlay) {
      return undefined;
    }
    if (!isActive) {
      wasActiveRef.current = false;
      video.pause();
      return undefined;
    }
    if (!wasActiveRef.current) {
      video.currentTime = 0;
      wasActiveRef.current = true;
    }
    void video.play().catch(() => {});
    return undefined;
  }, [videoCanPlay, src, isActive]);

  useLayoutEffect(() => {
    const el = staticPosterImgRef.current;
    if (el?.complete && el.naturalWidth > 0) {
      queueMicrotask(() => setStaticPoster('ok'));
    }
  }, [staticPosterUrl]);

  useEffect(() => {
    if (!videoCanPlay) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      if (posterBlobUrlRef.current) {
        URL.revokeObjectURL(posterBlobUrlRef.current);
        posterBlobUrlRef.current = null;
      }
    }, 500);
    return () => window.clearTimeout(id);
  }, [videoCanPlay]);

  useEffect(() => {
    if (staticPoster !== 'bad') {
      return undefined;
    }

    const video = videoRef.current;
    if (!video) {
      return undefined;
    }

    let cancelled = false;
    let posterCaptured = false;

    const disposeBlobPoster = () => {
      if (posterBlobUrlRef.current) {
        URL.revokeObjectURL(posterBlobUrlRef.current);
        posterBlobUrlRef.current = null;
      }
      setBlobPosterUrl(null);
    };

    const tryCapture = () => {
      if (cancelled || posterCaptured) {
        return;
      }
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) {
        return;
      }
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, BANNER_VIDEO_POSTER_MAX_SIDE / Math.max(w, h));
        canvas.width = Math.round(w * scale);
        canvas.height = Math.round(h * scale);
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (cancelled) {
            return;
          }
          posterCaptured = true;
          if (!blob) {
            return;
          }
          if (posterBlobUrlRef.current) {
            URL.revokeObjectURL(posterBlobUrlRef.current);
          }
          const url = URL.createObjectURL(blob);
          posterBlobUrlRef.current = url;
          setBlobPosterUrl(url);
        }, 'image/jpeg', 0.88);
      } catch {
        posterCaptured = true;
      }
    };

    const afterSeekForPoster = () => {
      video.removeEventListener('seeked', afterSeekForPoster);
      schedulePosterPaint(video, () => {
        if (cancelled) {
          return;
        }
        tryCapture();
        video.currentTime = 0;
        if (isActiveRef.current) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const onMeta = () => {
      if (cancelled || posterCaptured) {
        return;
      }
      const d = video.duration;
      const t = d && Number.isFinite(d) && d > 0.2
        ? Math.min(0.15, Math.max(0.06, d * 0.06))
        : 0.1;
      video.addEventListener('seeked', afterSeekForPoster);
      video.currentTime = t;
    };

    video.addEventListener('loadedmetadata', onMeta);

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onMeta);
      video.removeEventListener('seeked', afterSeekForPoster);
      disposeBlobPoster();
    };
  }, [src, staticPoster]);

  const hideStaticPoster = staticPoster !== 'ok';
  const showBlobPosterImg = staticPoster === 'bad' && !!blobPosterUrl;

  const markStaticPosterDecoded = () => {
    setStaticPoster('ok');
  };

  const handleVideoPlaybackEnded = () => {
    if (isActiveRef.current) {
      onPlaybackComplete?.();
    }
  };

  const handleVideoPlaybackError = () => {
    if (isActiveRef.current) {
      onPlaybackComplete?.();
    }
  };

  return (
    <div
      className={cn(
        styles.videoShell,
        objectFit === 'contain' && styles.videoShellStripMobile,
      )}
    >
      <video
        ref={videoRef}
        className={cn(
          styles.mediaVideo,
          videoCanPlay && styles.mediaVideoReady,
          videoCanPlay && styles.mediaVideoAbovePoster,
        )}
        src={src}
        autoPlay
        loop={shouldLoopVideo}
        muted
        playsInline
        preload="auto"
        onEnded={handleVideoPlaybackEnded}
        onError={handleVideoPlaybackError}
      />
      <V2Image
        ref={staticPosterImgRef}
        src={staticPosterUrl}
        alt=""
        fill
        sizes={posterSizes ?? '100vw'}
        className={cn(
          styles.videoPoster,
          styles.videoPosterLayer,
          hideStaticPoster && styles.videoPosterHidden,
        )}
        draggable={false}
        onLoad={(e) => {
          const el = e.currentTarget;
          if (typeof el.decode === 'function') {
            el.decode().then(markStaticPosterDecoded, markStaticPosterDecoded);
          } else {
            markStaticPosterDecoded();
          }
        }}
        onError={() => setStaticPoster('bad')}
      />
      {showBlobPosterImg ? (
        // eslint-disable-next-line @next/next/no-img-element -- краткоживущий blob: превью из canvas
        <img
          src={blobPosterUrl!}
          alt=""
          className={cn(styles.videoPoster, styles.videoPosterLayer)}
          draggable={false}
          onError={() => {
            if (posterBlobUrlRef.current) {
              URL.revokeObjectURL(posterBlobUrlRef.current);
              posterBlobUrlRef.current = null;
            }
            setBlobPosterUrl(null);
          }}
        />
      ) : null}
    </div>
  );
};

interface BannerStaticBannerImageProps {
  autoplayLogicEnabled: boolean;
  bannerName: string;
  imagePriority: boolean;
  imageSizes: string;
  isActive: boolean;
  isHero: boolean;
  isMobile: boolean;
  isMultiSlide: boolean;
  mediaSrc: string;
  onRequestAdvance: () => void;
}

const BannerStaticBannerImage = ({
  autoplayLogicEnabled,
  bannerName,
  imagePriority,
  imageSizes,
  isActive,
  isHero,
  isMobile,
  isMultiSlide,
  mediaSrc,
  onRequestAdvance,
}: BannerStaticBannerImageProps) => {
  const [imageDecoded, setImageDecoded] = useState(false);

  useEffect(() => {
    if (
      !isMultiSlide
      || !autoplayLogicEnabled
      || !isActive
      || !imageDecoded
    ) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => {
      onRequestAdvance();
    }, BANNER_IMAGE_DWELL_MS);
    return () => window.clearTimeout(timeoutId);
  }, [
    autoplayLogicEnabled,
    imageDecoded,
    isActive,
    isMultiSlide,
    onRequestAdvance,
  ]);

  return (
    <V2Image
      src={mediaSrc}
      alt={bannerName}
      fill
      className={cn(styles.media, !isHero && isMobile && styles.mediaStripMobile)}
      sizes={imageSizes}
      priority={imagePriority}
      onLoad={() => setImageDecoded(true)}
    />
  );
};

interface BannerSlideProps {
  activeSlideStore: BannerActiveSlideStore;
  autoplayLogicEnabled: boolean;
  banner: BannerInterface;
  imagePriority: boolean;
  isMobile: boolean;
  isMultiSlide: boolean;
  onCopy: (value: string) => void;
  onRequestAdvance: () => void;
  slideIndex: number;
  variant: 'strip' | 'hero';
}

const BannerSlide = ({
  activeSlideStore,
  autoplayLogicEnabled,
  banner,
  imagePriority,
  isMobile,
  isMultiSlide,
  onCopy,
  onRequestAdvance,
  slideIndex,
  variant,
}: BannerSlideProps) => {
  const isHero = variant === 'hero';
  const activeOriginalIndex = useSyncExternalStore(
    activeSlideStore.subscribe,
    activeSlideStore.getSnapshot,
    () => 0,
  );
  const isActive = slideIndex === activeOriginalIndex;

  const media = banner.desktopVideo;

  const handleCopy = () => {
    if (banner.copyValue) {
      onCopy(banner.copyValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCopy();
    }
  };

  const imageSizes = isHero
    ? '(max-width: 768px) 100vw, 60vw'
    : '(max-width: 767px) 100vw, (max-width: 1199px) 48vw, 32vw';

  const staticPosterUrlForMp4 = (playSrc: string) => (
    media!.posterSrc ?? playSrc.replace(/\.mp4$/i, '.poster.jpg')
  );

  const renderMedia = () => {
    if (!media?.src) {
      return null;
    }

    if (media.src.endsWith('.mp4')) {
      const staticPosterUrl = staticPosterUrlForMp4(media.src);
      const videoFit: 'cover' | 'contain' = !isHero && isMobile ? 'contain' : 'cover';
      return (
        <BannerVideo
          key={`${banner.id}|${media.src}|${staticPosterUrl}`}
          src={media.src}
          staticPosterUrl={staticPosterUrl}
          objectFit={videoFit}
          posterSizes={imageSizes}
          isActive={isActive}
          shouldLoopVideo={false}
          onPlaybackComplete={onRequestAdvance}
        />
      );
    }
    return (
      <BannerStaticBannerImage
        key={media.src}
        autoplayLogicEnabled={autoplayLogicEnabled}
        bannerName={banner.name}
        imagePriority={imagePriority}
        imageSizes={imageSizes}
        isActive={isActive}
        isHero={isHero}
        isMobile={isMobile}
        isMultiSlide={isMultiSlide}
        mediaSrc={media.src}
        onRequestAdvance={onRequestAdvance}
      />
    );
  };

  const mediaContent = renderMedia();
  const isClickable = !!(banner.link || banner.copyValue);

  const slideClass = isHero
    ? (isClickable && !banner.link ? styles.slideHeroClickable : styles.slideHero)
    : (isClickable && !banner.link ? styles.slideClickable : styles.slide);

  const skeletonClass = isHero ? styles.skeletonHero : styles.skeleton;

  return (
    <div className={cn(styles.slideWrapper, isHero && styles.slideWrapperHero)}>
      {mediaContent ? (
        banner.link ? (
          <Link href={banner.link} className={slideClass}>
            {mediaContent}
          </Link>
        ) : (
          <div
            className={slideClass}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onClick={banner.copyValue ? handleCopy : undefined}
            onKeyDown={banner.copyValue ? handleKeyDown : undefined}
          >
            {mediaContent}
          </div>
        )
      ) : (
        <Skeleton.Image active className={skeletonClass} />
      )}
    </div>
  );
};

export type BannerSliderVariant = 'strip' | 'hero';

interface BannerSliderProps {
  banners: BannerInterface[];
  variant?: BannerSliderVariant;
}

export const BannerSlider = ({ banners, variant = 'strip' }: BannerSliderProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.banner' });
  const { isMobile } = useContext(MobileContext);
  const [autoplayLogicEnabled, setAutoplayLogicEnabled] = useState(false);
  const isHero = variant === 'hero';

  const carouselAdvanceRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoplayLogicEnabled(true);
    }, BANNER_AUTOPLAY_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const sorted = useMemo(
    () => [...banners].sort((a, b) => a.order - b.order),
    [banners],
  );

  const activeSlideStore = useMemo(
    () => createBannerActiveSlideStore(),
    [sorted.length, variant],
  );

  const handleRequestAdvance = useCallback(() => {
    if (!autoplayLogicEnabled || sorted.length <= 1) {
      return;
    }
    carouselAdvanceRef.current?.();
  }, [autoplayLogicEnabled, sorted.length]);

  const carouselButtonGroup = useMemo(
    () => (
      <BannerCarouselStateBridge
        advanceRef={carouselAdvanceRef}
        activeSlideStore={activeSlideStore}
        sortedLength={sorted.length}
      />
    ),
    [activeSlideStore, sorted.length],
  );

  if (isEmpty(sorted)) {
    return null;
  }

  const handleCopy = (value: string) => {
    try {
      navigator.clipboard.writeText(value);
      toast(t('copySuccess'), 'success');
    } catch {
      toast(t('copyError'), 'error');
    }
  };

  const isMultiSlide = sorted.length > 1;

  const carousel = (
    <Carousel
      responsive={isHero ? responsiveHero : responsiveStrip}
      autoPlay={false}
      infinite
      pauseOnHover={false}
      shouldResetAutoplay={false}
      showDots={isMultiSlide}
      arrows={false}
      swipeable
      draggable={false}
      partialVisible={!isHero}
      itemClass={cn(styles.carouselItem, isHero && styles.carouselItemHero)}
      containerClass={cn(styles.carouselContainer, isHero && styles.carouselContainerHero)}
      dotListClass={cn(styles.dotList, isHero && styles.dotListHero)}
      customDot={<BannerCarouselDot />}
      customButtonGroup={carouselButtonGroup}
    >
      {sorted.map((banner, index) => (
        <BannerSlide
          key={banner.id}
          activeSlideStore={activeSlideStore}
          autoplayLogicEnabled={autoplayLogicEnabled}
          banner={banner}
          imagePriority={isHero && index === 0}
          isMultiSlide={isMultiSlide}
          isMobile={isMobile}
          onCopy={handleCopy}
          onRequestAdvance={handleRequestAdvance}
          slideIndex={index}
          variant={variant}
        />
      ))}
    </Carousel>
  );

  if (isHero) {
    return <div className={styles.sectionHero}>{carousel}</div>;
  }

  return <section className={styles.section}>{carousel}</section>;
};

const BannerCarouselDot = ({ onClick, active }: DotProps) => (
  <button
    type="button"
    className={cn(styles.dot, active && styles.dotActive)}
    onClick={onClick}
    aria-label="Go to banner"
  />
);
