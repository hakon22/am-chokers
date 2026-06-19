import Document, {
  type DocumentContext,
  type DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from 'next/document';

import { getRequestLanguageFromCookieHeader } from '@/lib/server/get-request-language';
import { ensureServerServicesReady } from '@/lib/server/ensure-server-services-ready';
import { isNextProductionBuild } from '@/lib/server/is-next-production-build';
import { resolveSiteVersion } from '@/lib/server/resolve-site-settings';
import { getDefaultLanguageCode } from '@shared/language-config';
import { cormorantFont, interFont } from '@/lib/fonts/v2-fonts';
import type { SiteVersion } from '@/types/SiteVersion';

const BUILD_TIME_SITE_VERSION: SiteVersion = 'v2';

interface DocumentPropsInterface extends DocumentInitialProps {
  languageCode: 'ru' | 'en';
  siteVersion: SiteVersion;
}

/**
 * Кастомный Document: lang, data-scroll-behavior на html и класс body.v2-theme
 */
export default class CustomDocument extends Document<DocumentPropsInterface> {
  /**
   * Читает язык из cookie и версию сайта для атрибута lang и класса body
   * @param context - контекст Next.js Document
   * @returns props с languageCode и siteVersion
   */
  static getInitialProps = async (context: DocumentContext): Promise<DocumentPropsInterface> => {
    const initialProps = await Document.getInitialProps(context);

    if (isNextProductionBuild()) {
      return {
        ...initialProps,
        languageCode: getDefaultLanguageCode(),
        siteVersion: BUILD_TIME_SITE_VERSION,
      };
    }

    const cookieHeader = context.req?.headers.cookie;
    const languageCode = getRequestLanguageFromCookieHeader(cookieHeader);
    await ensureServerServicesReady();
    const siteVersion = await resolveSiteVersion();

    return {
      ...initialProps,
      languageCode,
      siteVersion,
    };
  };

  render = () => {
    const { languageCode, siteVersion } = this.props;
    const isV2Theme = siteVersion === 'v2';

    const bodyClassName = [
      isV2Theme ? 'v2-theme' : '',
      isV2Theme ? interFont.variable : '',
      isV2Theme ? cormorantFont.variable : '',
    ].filter(Boolean).join(' ') || undefined;

    return (
      <Html lang={languageCode} data-scroll-behavior="smooth">
        <Head />
        <body className={bodyClassName}>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  };
}
