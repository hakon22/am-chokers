import { routes } from '@/routes';
import { ItemInterface } from '@/types/item/Item';

export const getHref = (item?: ItemInterface) => item && item.group ? `${routes.page.base.catalog}/${item.group.code}/${item.translateName}` : routes.page.base.catalog;
