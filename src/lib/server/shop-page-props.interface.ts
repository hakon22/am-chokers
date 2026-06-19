import type { AppBootstrapInterface } from '@/lib/server/load-app-bootstrap';
import type { PageContextInterface } from '@/lib/server/load-page-context';

export type ShopPagePropsInterface = AppBootstrapInterface & PageContextInterface;
