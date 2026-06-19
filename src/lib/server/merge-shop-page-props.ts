import type { IncomingMessage } from 'http';

import { loadAppBootstrap } from '@/lib/server/load-app-bootstrap';
import { loadPageContext } from '@/lib/server/load-page-context';
import { serializeForNextProps } from '@/lib/server/serialize-for-next-props';
import type { ShopPagePropsInterface } from '@/lib/server/shop-page-props.interface';

/**
 * Добавляет bootstrap и контекст страницы к props shop-страниц
 * @param pageProps - специфичные для страницы props
 * @param request - HTTP-запрос Next.js
 * @returns объединённые props для getServerSideProps / getStaticProps
 */
export const mergeShopPageProps = async <T extends object>(
  pageProps: T,
  request?: IncomingMessage,
): Promise<T & ShopPagePropsInterface> => {
  const bootstrap = await loadAppBootstrap();
  const pageContext = loadPageContext(request);

  return serializeForNextProps({
    ...pageProps,
    ...bootstrap,
    ...pageContext,
  });
};
