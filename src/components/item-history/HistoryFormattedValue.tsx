import cn from 'classnames';

import styles from '@/components/item-history/HistoryFormattedValue.module.scss';

type Props = {
  /** Текст значения (многострочный — через `\n`, с сервера истории) */
  text: string;
  /** Класс цвета/начертания (например «было» / «стало») */
  className: string;
};

/**
 * Выводит значение истории: одна строка или маркированный список при `\n`
 * @param text - отформатированное значение
 * @param className - CSS-модуль темы для `span` или `ul`
 * @returns элемент для вставки в таймлайн
 */
export const HistoryFormattedValue = ({ text, className }: Props) => {
  if (!text.includes('\n')) {
    return <span className={className}>{text}</span>;
  }
  const lines = text.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) {
    return <span className={className} />;
  }
  return (
    <ul className={cn(styles.list, className)}>
      {lines.map((line, index) => (
        <li key={index}>{line}</li>
      ))}
    </ul>
  );
};
