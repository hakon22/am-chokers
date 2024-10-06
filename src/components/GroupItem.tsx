import { useTranslation } from 'react-i18next';
import { ItemInterface } from '@/types/item/Item';
import Link from 'next/link';
import { ImageHover } from '@/components/ImageHover';
import { translate } from '@/utilities/translate';
import { routes } from '@/routes';

export const GroupItem = ({ items }: { items: ItemInterface[] }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  return (
    <div className="d-flex col-12 justify-content-between">
      {items.map(({
        id, name, price, images, height, group, className,
      }) => (
        <Link href={`${routes.catalog}/${group}/${translate(name)}`} style={{ width: '23%' }} key={id}>
          <ImageHover
            className={className}
            height={height}
            images={images}
            name={name}
            description={t('price', { price })}
          />
        </Link>
      ))}
    </div>
  );
};
