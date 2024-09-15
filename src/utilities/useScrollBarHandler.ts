import { useEffect, useState } from 'react';

export const useScrollbarWidth = () => {
  const [scrollBarWidth, setScrollBarWidth] = useState(0);

  const calculateScrollbarWidth = () => {
    // Создаем временный элемент для вычисления ширины
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll'; // Добавляем полосу прокрутки
    outer.style.width = '100px'; // Ширина контейнера
    document.body.appendChild(outer);

    const inner = document.createElement('div');
    inner.style.width = '100%'; // Внедряем внутренний элемент
    outer.appendChild(inner);

    // Вычисляем ширину полосы прокрутки
    const width = outer.offsetWidth - inner.offsetWidth;

    // Удаляем элементы из DOM
    outer.parentNode?.removeChild(outer);

    return width;
  };

  useEffect(() => {
    const handleResize = () => {
      setScrollBarWidth(calculateScrollbarWidth());
    };

    // Запускаем функцию при первом рендере и изменениях окна
    handleResize();
    window.addEventListener('resize', handleResize);

    // Убираем обработчик при размонтировании компонента
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return `${scrollBarWidth}px`;
};
