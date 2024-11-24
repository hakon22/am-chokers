import { Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, type ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/navigation';

import { routes } from '@/routes';
import type { ItemInterface } from '@/types/item/Item';
import { translate } from '@/utilities/translate';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch } from '@/utilities/hooks';
import { deleteItem, updateItem } from '@/slices/appSlice';
import { toast } from '@/utilities/toast';

export type Context = { action: string, id: number } | undefined;
export type SetContext = React.Dispatch<React.SetStateAction<Context>>;

type CardContextMenuProps = {
  children: ReactNode,
  item?: ItemInterface,
  disabled: boolean,
};

export const ContextMenu = ({ children, item, disabled, ...rest }: CardContextMenuProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.contextMenu' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const router = useRouter();

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const handleDelete = async (target: ItemInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, item: deletedItem } } = await dispatch(deleteItem(target.id)) as { payload: { code: number; item: ItemInterface; } };
    if (payloadCode === 1) {
      toast(tToast('itemDeletedSuccess', { name: deletedItem.name }), 'success');
    }
    setIsSubmit(false);
  };

  const handleUpdate = async (target: ItemInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, item: updatedItem } } = await dispatch(updateItem({ id: target.id, data: { order: undefined } })) as { payload: { code: number; item: ItemInterface; } };
    // if (payloadCode === 1) {}
    setIsSubmit(false);
  };

  const items: MenuProps['items'] = [
    ...(item ? [{
      label: t('edit'),
      key: '1',
      onClick: () => router.push(`${routes.catalog}/${item.group.code}/${translate(item.name)}`),
    },
    {
      label: t('remove'),
      key: '2',
      onClick: () => handleDelete(item),
    },
    {
      label: t('removeInCell'),
      key: '3',
      onClick: () => handleUpdate(item),
    }] : []),
    ...(!item ? [{
      label: t('addInCell'),
      key: '4',
      // onClick: () => handleUpdate(item),
    }] : []),
  ];

  return (
    <Dropdown menu={{ items }} trigger={['contextMenu']} disabled={disabled} {...rest}>
      <div>{children}</div>
    </Dropdown>
  );
};
