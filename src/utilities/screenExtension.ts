/** Фактическая ширина окна */
export const getWidth = () => window.innerWidth;

/** Фактическая высота окна */
export const getHeight = () => typeof window !== 'undefined' ? window.innerHeight : 1000;

/** Соотношение, считаем как масштаб */
export const getRatio = () => window.devicePixelRatio;

/** Получить итоговое расширение экрана */
export const getExtension = () => getWidth() * getRatio();
