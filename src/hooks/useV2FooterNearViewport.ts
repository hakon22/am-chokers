import { useEffect, useRef, useState } from 'react';

import { V2_FOOTER_OFFSET_GAP } from '@/utilities/getV2FooterTop';

/**
 * Возвращает true, когда footer перекрывает зону fixed bar (обновление только при смене состояния)
 * @param barZoneFromBottom - высота зоны bar от низа viewport (nav + bar), px
 * @returns footer перекрывает bar
 */
export const useV2FooterNearViewport = (barZoneFromBottom: number): boolean => {
  const [footerNearViewport, setFooterNearViewport] = useState(false);
  const footerNearViewportRef = useRef(false);

  useEffect(() => {
    const footerElement = document.querySelector('.v2-app footer');

    if (!footerElement) {
      return;
    }

    /**
     * Проверяет перекрытие footer и bar; setState только при смене значения
     */
    const checkFooterOverlap = (): void => {
      const footerTop = footerElement.getBoundingClientRect().top;
      const nextFooterNearViewport = footerTop < window.innerHeight - barZoneFromBottom + V2_FOOTER_OFFSET_GAP;

      if (nextFooterNearViewport === footerNearViewportRef.current) {
        return;
      }

      footerNearViewportRef.current = nextFooterNearViewport;
      setFooterNearViewport(nextFooterNearViewport);
    };

    checkFooterOverlap();

    window.addEventListener('scroll', checkFooterOverlap, { passive: true });
    window.addEventListener('resize', checkFooterOverlap);

    const resizeObserver = new ResizeObserver(checkFooterOverlap);
    resizeObserver.observe(footerElement);

    return () => {
      window.removeEventListener('scroll', checkFooterOverlap);
      window.removeEventListener('resize', checkFooterOverlap);
      resizeObserver.disconnect();
    };
  }, [barZoneFromBottom]);

  return footerNearViewport;
};
