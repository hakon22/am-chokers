import { toast as message } from 'react-toastify';

type ToastType = 'info' | 'success' |'warning' | 'error';

export const toast = (text: string, type: ToastType) => message[type](text);
