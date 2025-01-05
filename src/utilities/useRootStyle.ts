import { useEffect } from 'react';

import { getWidth, getRatio } from '@/utilities/screenExtension';

export const useRootStyle = () => {
  useEffect(() => {
    const handleResize = () => {
      const width = getWidth();
      const ratio = getRatio();
      console.log(width, ratio, width * ratio);
      document.documentElement.style.setProperty('--ratio', `${ratio}`);
    };

    // Запускаем функцию при первом рендере и изменениях окна
    handleResize();
    window.addEventListener('resize', handleResize);

    // Убираем обработчик при размонтировании компонента
    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
