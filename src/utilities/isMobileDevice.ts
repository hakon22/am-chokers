export const isMobileDevice = (userAgent?: string) => Boolean(userAgent?.match(
  /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i,
));
