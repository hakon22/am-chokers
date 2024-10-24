import { useEffect } from 'react';

export const useRootStyle = () => {
  useEffect(() => {
    const handleResize = () => {
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
};
