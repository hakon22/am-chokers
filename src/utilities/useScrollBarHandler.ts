import { useEffect, useState } from 'react';

export const useScrollbarWidth = () => {
  const [scrollBarWidth, setScrollBarWidth] = useState(0);

  const calculateScrollbarWidth = () => window.innerWidth - document.body.clientWidth;

  useEffect(() => {
    const handleResize = () => {
      setScrollBarWidth(calculateScrollbarWidth());
      const width = window.innerWidth; // Фактическая ширина окна
      const ratio = window.devicePixelRatio; // Соотношение, считаем как масштаб
      console.log(width, ratio, width * ratio);
      document.documentElement.style.setProperty('--ratio', `${ratio}`);
    };

    // Запускаем функцию при первом рендере и изменениях окна
    handleResize();
    window.addEventListener('resize', handleResize);

    // Убираем обработчик при размонтировании компонента
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return `${scrollBarWidth}px`;
};
