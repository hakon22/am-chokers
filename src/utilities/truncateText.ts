export const truncateText = (text: string, length = 50) => (text?.length || 0) > length ? text.substring(0, length) + '...' : text;
