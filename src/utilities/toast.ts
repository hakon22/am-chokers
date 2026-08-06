import hotToast from 'react-hot-toast';

type ToastType = 'info' | 'success' | 'warning' | 'error';

/**
 * Показывает toast-уведомление заданного типа
 * @param text - текст сообщения
 * @param type - тип уведомления: info, success, warning или error
 * @returns идентификатор toast из react-hot-toast
 */
export const toast = (text: string, type: ToastType) => {
  if (type === 'success') {
    return hotToast.success(text);
  }

  if (type === 'error') {
    return hotToast.error(text);
  }

  if (type === 'warning') {
    return hotToast(text, {
      style: {
        background: '#EAEEF6',
        color: '#363B44',
        border: '1px solid #5A6E96',
      },
    });
  }

  return hotToast(text);
};
