import localFont from 'next/font/local';

export const interFont = localFont({
  src: [
    {
      path: '../../fonts/v2/Inter_24pt-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/Inter_24pt-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/Inter_24pt-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/Inter_24pt-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-inter',
});

export const cormorantFont = localFont({
  src: [
    {
      path: '../../fonts/v2/CormorantGaramond-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/CormorantGaramond-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/CormorantGaramond-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '../../fonts/v2/CormorantGaramond-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../../fonts/v2/CormorantGaramond-LightItalic.woff2',
      weight: '300',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-cormorant',
});
