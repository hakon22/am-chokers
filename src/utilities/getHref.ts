import { routes } from '@/routes';
import { ItemInterface } from '@/types/item/Item';

export const getHref = (item?: ItemInterface) => item && item.group ? `${routes.catalog}/${item.group.code}/${item.translateName}` : routes.catalog;
