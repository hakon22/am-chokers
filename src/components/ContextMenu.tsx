import { Button, Dropdown, Form, Popconfirm, Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { useContext, useEffect, useState, type ReactNode } from 'react';
import type { MenuProps } from 'antd';
import { useRouter } from 'next/router';
import Image from 'next/image';

import type { ItemInterface } from '@/types/item/Item';
import { SubmitContext } from '@/components/Context';
import { useAppDispatch, useAppSelector } from '@/utilities/hooks';
import { deleteItem, type ItemResponseInterface, updateItem } from '@/slices/appSlice';
import { toast } from '@/utilities/toast';
import { UserRoleEnum } from '@server/types/user/enums/user.role.enum';
import { getHref } from '@/utilities/getHref';
import { NotFoundContent } from '@/components/forms/NotFoundContent';

export type Context = { action: string, id: number } | undefined;
export type SetContext = React.Dispatch<React.SetStateAction<Context>>;

interface CardContextMenuProps extends React.HTMLAttributes<HTMLElement> {
  children: ReactNode;
  order: number;
  item?: ItemInterface;
}

export const ContextMenu = ({ children, order, item, ...props }: CardContextMenuProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.contextMenu' });
  const { t: tToast } = useTranslation('translation', { keyPrefix: 'toast' });
  const router = useRouter();

  const { role } = useAppSelector((state) => state.user);
  const { items } = useAppSelector((state) => state.app);

  const { bestsellers, collections } = items.reduce((acc, value) => {
    if (value.order) return acc;

    if (value.bestseller) {
      acc.bestsellers.push(value);
    }
    if (value.collection) {
      acc.collections.push(value);
    }
    return acc;
  }, { bestsellers: [], collections: [] } as { bestsellers: ItemInterface[]; collections: ItemInterface[]; });

  const [isSelect, setIsSelect] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemInterface>();

  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const handleDelete = async (target: ItemInterface) => {
    setIsSubmit(true);
    const { payload: { code: payloadCode, item: deletedItem } } = await dispatch(deleteItem(target.id)) as { payload: ItemResponseInterface };
    if (payloadCode === 1) {
      toast(tToast('itemDeletedSuccess', { name: deletedItem.name }), 'success');
    }
    setIsSubmit(false);
  };

  const handleUpdate = async (target: ItemInterface, value: undefined | number) => {
    setIsSubmit(true);
    await dispatch(updateItem({ id: target.id, data: { order: value } }));
    setIsSubmit(false);
  };

  const menu: MenuProps['items'] = [
    ...(item ? [{
      label: t('edit'),
      key: '1',
      onClick: () => router.push({ pathname: getHref(item), query: { edit: true } }),
    },
    {
      label: (<Popconfirm title={t('deleteConfirm')} okText={t('okText')} cancelText={t('cancel')} onConfirm={() => handleDelete(item)}>{t('remove')}</Popconfirm>),
      key: '2',
    },
    {
      label: t('removeInCell'),
      key: '3',
      onClick: () => handleUpdate(item, null as unknown as number),
    }] : []),
    ...(!item ? [{
      label: t('addInCell'),
      key: '4',
      onClick: () => setIsSelect(true),
    }] : []),
  ];

  useEffect(() => {
    if (isSelect) {
      return () => setIsSelect(false);
    }
  }, [isSelect]);

  useEffect(() => {
    if (selectedItem) {
      handleUpdate(selectedItem, order).then(() => {
        setSelectedItem(undefined);
        setIsSelect(false);
      });
    }
  }, [selectedItem]);

  return (
    <Dropdown menu={{ items: menu }} trigger={['contextMenu']} disabled={role !== UserRoleEnum.ADMIN} {...props}>
      {isSelect
        ? (
          <Form className="d-flex justify-content-center align-items-center p-absolute w-100">
            <Select
              showSearch
              notFoundContent={<NotFoundContent />}
              style={{ width: 400 }}
              size="large"
              placeholder={t('selectItem')}
              onSelect={(itemId: number) => {
                const candidate = (order < 4 ? bestsellers : collections).find(({ id }) => id === itemId);
                setSelectedItem(candidate);
              }}
              onBlur={() => setIsSelect(false)}
              filterOption={(input, option) => 
                option?.label.props.title.toLowerCase().includes(input.toLowerCase())
              }
              options={(order < 4 ? bestsellers : collections).map(({ id, name, images }) => ({
                label: <Button
                  className="w-100 h-100 py-0 ps-0 pe-5 d-flex justify-content-between align-items-center"
                  title={name}
                >
                  <Image alt={name} width={100} height={100} unoptimized src={images[0].src} />
                  <span className="fs-6">{name}</span>
                </Button>,
                value: id,
              }))}
            />
          </Form>
        )
        : (<div>{children}</div>)
      }
    </Dropdown>
  );
};
