import { useTranslation } from 'react-i18next';
import Link from 'next/link';

import type { ItemInterface } from '@/types/item/Item';
import { ImageHover } from '@/components/ImageHover';
import { getHref } from '@/utilities/getHref';

export const GroupItem = ({ items }: { items: ItemInterface[] }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.cardItem' });

  return (
    <div className="d-grid col-12 gap-5" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
      {items.map(({
        id, name, price, images, height, group, className,
      }) => (
        <Link href={getHref({ name, group } as ItemInterface)} key={id}>
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
