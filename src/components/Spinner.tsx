import { useEffect, useState } from 'react';

const SPINNER_FADE_OUT_MS = 200;

/**
 * Полноэкранный спиннер загрузки с плавным исчезновением
 * @param isLoaded - true, когда оверлей можно скрывать
 */
export const Spinner = ({ isLoaded }: { isLoaded: boolean }) => {
  const [isDismissed, setIsDismissed] = useState(isLoaded);

  useEffect(() => {
    if (!isLoaded) {
      const showOverlayFrameId = window.requestAnimationFrame(() => {
        setIsDismissed(false);
      });

      return () => {
        window.cancelAnimationFrame(showOverlayFrameId);
      };
    }

    if (isDismissed) {
      return undefined;
    }

    const dismissOverlayTimerId = window.setTimeout(() => {
      setIsDismissed(true);
    }, SPINNER_FADE_OUT_MS);

    return () => {
      window.clearTimeout(dismissOverlayTimerId);
    };
  }, [isDismissed, isLoaded]);

  useEffect(() => {
    const next = document.getElementById('__next');
    if (!next) {
      return undefined;
    }

    const isOverlayBlockingScroll = !isDismissed && !isLoaded;

    if (isOverlayBlockingScroll) {
      document.body.style.overflowY = 'hidden';
      next.style.overflowY = 'hidden';
    } else {
      document.body.style.overflowY = '';
      next.style.overflowY = '';
    }

    return () => {
      document.body.style.overflowY = '';
      next.style.overflowY = '';
    };
  }, [isDismissed, isLoaded]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="position-fixed start-0 top-0 end-0 bottom-0 vw-100 vh-100 app-spinner-overlay"
      style={{
        zIndex: 999999,
        background: 'radial-gradient(circle at top, #f7f1f2 37%, #f6eff1 45%, #c4b7af 100%)',
        opacity: isLoaded ? 0 : 1,
        transition: `opacity ${SPINNER_FADE_OUT_MS}ms ease`,
        pointerEvents: isLoaded ? 'none' : 'auto',
      }}
    >
      <div className="inner-circles-loader" />
    </div>
  );
};
