import { routes } from '@/routes';
import { ItemInterface } from '@/types/item/Item';
import { translate } from '@/utilities/translate';

export const getHref = (item?: ItemInterface) => item && item.group ? `${routes.catalog}/${item?.group?.code}/${translate(item?.name)}` : routes.catalog;
