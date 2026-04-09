import Link from 'next/link';
import Image from 'next/image';
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Carousel, { type DotProps } from 'react-multi-carousel';
import { Skeleton } from 'antd';
import cn from 'classnames';
import 'react-multi-carousel/lib/styles.css';

import { MobileContext } from '@/components/Context';
import { toast } from '@/utilities/toast';
import styles from '@/themes/v2/components/home/BannerSlider.module.scss';
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
 * Превью: 1) JPEG с сервера (`*.poster.jpg`, тот же origin/path — без CORS для <img>).
 * 2) Если файла нет (старые баннеры) — кадр через canvas (часто ломается на чужом CDN из‑за CORS у drawImage).
 */
const BannerVideo = ({
  src,
  staticPosterUrl,
  objectFit = 'cover',
}: {
  src: string;
  staticPosterUrl: string;
  objectFit?: 'cover' | 'contain';
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterBlobUrlRef = useRef<string | null>(null);
  const [staticPoster, setStaticPoster] = useState<StaticPosterLoad>('checking');
  const [blobPosterUrl, setBlobPosterUrl] = useState<string | null>(null);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const staticPosterImgRef = useRef<HTMLImageElement>(null);

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
    if (!videoCanPlay) {
      return undefined;
    }
    const v = videoRef.current;
    if (!v) {
      return undefined;
    }
    void v.play().catch(() => {});
    return undefined;
  }, [videoCanPlay, src]);

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
        void video.play();
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

  // Не скрывать постер через videoPosterHidden при videoCanPlay: иначе, если canplay раньше onLoad JPEG,
  // к моменту «ok» постер так и остаётся с visibility:hidden. Видео при canplay поднимаем z-index над постером.
  const hideStaticPoster = staticPoster !== 'ok';
  const showBlobPosterImg = staticPoster === 'bad' && !!blobPosterUrl;

  const markStaticPosterDecoded = () => {
    setStaticPoster('ok');
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
        loop
        muted
        playsInline
        preload="auto"
      />
      {/* eslint-disable-next-line @next/next/no-img-element -- превью с того же хранилища, что и mp4 */}
      <img
        ref={staticPosterImgRef}
        src={staticPosterUrl}
        alt=""
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

interface BannerSlideProps {
  banner: BannerInterface;
  isMobile: boolean;
  onCopy: (value: string) => void;
  variant: 'strip' | 'hero';
  imagePriority: boolean;
}

const BannerSlide = ({ banner, isMobile, onCopy, variant, imagePriority }: BannerSlideProps) => {
  const isHero = variant === 'hero';

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
    if (!media?.src) return null;

    if (media.src.endsWith('.mp4')) {
      const staticPosterUrl = staticPosterUrlForMp4(media.src);
      const videoFit: 'cover' | 'contain' = !isHero && isMobile ? 'contain' : 'cover';
      return (
        <BannerVideo
          key={`${banner.id}|${media.src}|${staticPosterUrl}`}
          src={media.src}
          staticPosterUrl={staticPosterUrl}
          objectFit={videoFit}
        />
      );
    }
    return (
      <Image
        src={media.src}
        alt={banner.name}
        fill
        className={cn(styles.media, !isHero && isMobile && styles.mediaStripMobile)}
        sizes={imageSizes}
        priority={imagePriority}
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
  const [autoPlay, setAutoPlay] = useState(false);
  const isHero = variant === 'hero';

  useEffect(() => {
    const timer = setTimeout(() => setAutoPlay(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const sorted = [...banners].sort((a, b) => a.order - b.order);

  if (!sorted.length) {
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

  const carousel = (
    <Carousel
      responsive={isHero ? responsiveHero : responsiveStrip}
      autoPlay={autoPlay}
      autoPlaySpeed={5000}
      infinite
      pauseOnHover
      shouldResetAutoplay={false}
      showDots={sorted.length > 1}
      arrows={false}
      swipeable
      draggable={false}
      partialVisible={!isHero}
      itemClass={cn(styles.carouselItem, isHero && styles.carouselItemHero)}
      containerClass={cn(styles.carouselContainer, isHero && styles.carouselContainerHero)}
      dotListClass={cn(styles.dotList, isHero && styles.dotListHero)}
      customDot={<BannerCarouselDot />}
    >
      {sorted.map((banner, index) => (
        <BannerSlide
          key={banner.id}
          banner={banner}
          isMobile={isMobile}
          onCopy={handleCopy}
          variant={variant}
          imagePriority={isHero && index === 0}
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
