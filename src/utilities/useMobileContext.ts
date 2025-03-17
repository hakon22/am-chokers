import { useEffect, useContext } from 'react';

import { MobileContext, NavbarContext } from '@/components/Context';
import { getWidth } from '@/utilities/screenExtension';

export const useMobileContext = () => {
  const { setIsMobile } = useContext(MobileContext);
  const { setIsActive } = useContext(NavbarContext);

  useEffect(() => {
    const handleResize = () => {
      const width = getWidth();
      setIsMobile(width < 1200);
      if (width > 1199) {
        setIsActive(false);
        if (document.body.style.overflowY === 'hidden') {
          document.body.style.overflowY = 'scroll';
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
