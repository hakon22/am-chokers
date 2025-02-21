import { useEffect, useContext } from 'react';

import { MobileContext } from '@/components/Context';
import { getWidth } from '@/utilities/screenExtension';

export const useMobileContext = () => {
  const { setIsMobile } = useContext(MobileContext);

  useEffect(() => {
    const handleResize = () => {
      const width = getWidth();
      setIsMobile(width < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
