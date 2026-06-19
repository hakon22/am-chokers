import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
} from 'react';

const FINE_POINTER_HOVER_MEDIA_QUERY = '(hover: hover) and (pointer: fine)';

/**
 * Проверяет, что pointer-событие началось на интерактивном элементе карточки (ссылка, кнопка)
 * @param target - DOM-элемент, на котором произошло событие
 * @returns true, если нельзя вызывать setPointerCapture — иначе ломается клик по Link
 */
const isCarouselInteractiveTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest('a, button, input, textarea, select, label'));
};

export type CarouselInteractionPauseProps = Pick<
  HTMLAttributes<HTMLDivElement>,
  'onPointerDown' | 'onPointerUp' | 'onTouchStartCapture' | 'onMouseEnter' | 'onMouseLeave'
>;

/**
 * Пауза автоплея карусели при удержании pointer (touch/pen/mouse) и при hover на fine-pointer.
 * Touch: touchstart + document touchend (не pointercancel — он срывается при drag карусели).
 * Mouse: pointer capture до pointerup, кроме кликов по ссылкам и кнопкам внутри карусели.
 * @returns флаг паузы и props для обёртки карусели
 */
export const useCarouselInteractionAutoplayPause = () => {
  const activeMousePointerIdsRef = useRef<Set<number>>(new Set());
  const [isTouchActive, setIsTouchActive] = useState(false);
  const [isMousePointerHeld, setIsMousePointerHeld] = useState(false);
  const [isFinePointerHovered, setIsFinePointerHovered] = useState(false);
  const supportsFinePointerHoverRef = useRef(false);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(FINE_POINTER_HOVER_MEDIA_QUERY);

    /**
     * Синхронизирует флаг поддержки hover-паузы с текущим media query
     */
    const syncFinePointerHoverSupport = (): void => {
      supportsFinePointerHoverRef.current = mediaQueryList.matches;
      if (!mediaQueryList.matches) {
        setIsFinePointerHovered(false);
      }
    };

    syncFinePointerHoverSupport();
    mediaQueryList.addEventListener('change', syncFinePointerHoverSupport);
    return () => {
      mediaQueryList.removeEventListener('change', syncFinePointerHoverSupport);
    };
  }, []);

  useEffect(() => {
    /**
     * Снимает touch-паузу только когда на экране не осталось активных касаний
     * @param event - touchend или touchcancel на document
     */
    const clearTouchPauseIfAllTouchesEnded = (event: TouchEvent): void => {
      if (event.touches.length === 0) {
        setIsTouchActive(false);
      }
    };

    document.addEventListener('touchend', clearTouchPauseIfAllTouchesEnded, { capture: true });
    document.addEventListener('touchcancel', clearTouchPauseIfAllTouchesEnded, { capture: true });
    return () => {
      document.removeEventListener('touchend', clearTouchPauseIfAllTouchesEnded, { capture: true });
      document.removeEventListener('touchcancel', clearTouchPauseIfAllTouchesEnded, { capture: true });
    };
  }, []);

  /**
   * Обновляет isMousePointerHeld по набору активных mouse/pen pointer id
   */
  const syncMousePointerHeldState = useCallback((): void => {
    setIsMousePointerHeld(activeMousePointerIdsRef.current.size > 0);
  }, []);

  /**
   * Включает touch-паузу при любом касании обёртки карусели (включая drag без отпускания)
   * @param _event - touchstart на обёртке
   */
  const handleTouchStart = useCallback((): void => {
    setIsTouchActive(true);
  }, []);

  /**
   * Включает mouse/pen-паузу и захватывает pointer до pointerup
   * @param event - pointerdown на обёртке
   */
  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const { pointerId, pointerType, currentTarget, target } = event;
    if (pointerType === 'touch') {
      return;
    }
    if (isCarouselInteractiveTarget(target)) {
      return;
    }
    if (activeMousePointerIdsRef.current.has(pointerId)) {
      return;
    }
    activeMousePointerIdsRef.current.add(pointerId);
    currentTarget.setPointerCapture(pointerId);
    syncMousePointerHeldState();
  }, [syncMousePointerHeldState]);

  /**
   * Снимает mouse/pen-паузу после отпускания кнопки
   * @param event - pointerup на обёртке
   */
  const handlePointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>): void => {
    const { pointerId, pointerType, currentTarget } = event;
    if (pointerType === 'touch') {
      return;
    }
    if (currentTarget.hasPointerCapture(pointerId)) {
      currentTarget.releasePointerCapture(pointerId);
    }
    activeMousePointerIdsRef.current.delete(pointerId);
    syncMousePointerHeldState();
  }, [syncMousePointerHeldState]);

  /**
   * Включает hover-паузу только на устройствах с fine pointer и hover
   */
  const handleMouseEnter = useCallback((): void => {
    if (supportsFinePointerHoverRef.current) {
      setIsFinePointerHovered(true);
    }
  }, []);

  /**
   * Снимает hover-паузу при уходе курсора с обёртки карусели
   */
  const handleMouseLeave = useCallback((): void => {
    if (supportsFinePointerHoverRef.current) {
      setIsFinePointerHovered(false);
    }
  }, []);

  const isAutoplayPausedByInteraction = isTouchActive || isMousePointerHeld || isFinePointerHovered;

  const interactionPauseProps = useMemo(
    (): CarouselInteractionPauseProps => ({
      onTouchStartCapture: handleTouchStart,
      onPointerDown: handlePointerDown,
      onPointerUp: handlePointerUp,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }),
    [handleMouseEnter, handleMouseLeave, handlePointerDown, handlePointerUp, handleTouchStart],
  );

  return {
    isAutoplayPausedByInteraction,
    interactionPauseProps,
  };
};
