import Document, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import { getRequestLanguageFromCookieHeader } from '@/lib/server/get-request-language';

interface DocumentPropsInterface extends DocumentInitialProps {
  languageCode: 'ru' | 'en';
}

/**
 * Кастомный Document: lang на html и preload критичных шрифтов v2 (D6)
 */
export default class CustomDocument extends Document<DocumentPropsInterface> {
  /**
   * Читает язык из cookie для атрибута lang
   * @param context - контекст Next.js Document
   * @returns props с languageCode
   */
  static getInitialProps = async (context: DocumentContext): Promise<DocumentPropsInterface> => {
    const initialProps = await Document.getInitialProps(context);
    const cookieHeader = context.req?.headers.cookie;
    const languageCode = getRequestLanguageFromCookieHeader(cookieHeader);

    return {
      ...initialProps,
      languageCode,
    };
  };

  render = () => {
    const { languageCode } = this.props;

    return (
      <Html lang={languageCode}>
        <Head>
          <link
            rel="preload"
            href="/fonts/v2/Inter_24pt-Regular.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
          <link
            rel="preload"
            href="/fonts/v2/CormorantGaramond-Light.woff2"
            as="font"
            type="font/woff2"
            crossOrigin="anonymous"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  };
}
