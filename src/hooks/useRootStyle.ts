import { useEffect } from 'react';

import { getWidth, getRatio, getHeight } from '@/utilities/screenExtension';

export const useRootStyle = () => {
  useEffect(() => {
    const handleResize = () => {
      const width = getWidth();
      const height = getHeight();
      const ratio = getRatio();
      console.log(width, height, ratio, width * ratio);
      document.documentElement.style.setProperty('--ratio', `${ratio}`);
    };

    // Запускаем функцию при первом рендере и изменениях окна
    handleResize();
    window.addEventListener('resize', handleResize);

    // Убираем обработчик при размонтировании компонента
    return () => window.removeEventListener('resize', handleResize);
  }, []);
};
