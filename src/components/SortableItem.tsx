import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { DeleteOutlined } from '@ant-design/icons';
import { CSS } from '@dnd-kit/utilities';
import { Badge } from 'antd';
import { useContext } from 'react';
import type { UploadFile } from 'antd/lib';

import { SubmitContext } from '@/components/Context';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { deleteItemImage } from '@/slices/appSlice';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { ResponseFileInterface } from '@/types/storage/ResponseFileInterface';

export const SortableItem = ({ image, index, activeId, setImages, setFileList }: { image: ImageEntity, index: number, activeId: number, setImages: React.Dispatch<React.SetStateAction<ImageEntity[]>>, setFileList: React.Dispatch<React.SetStateAction<UploadFile<ResponseFileInterface>[]>> }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.sortableItem' });
  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const { id, src, name } = image;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  let boxShadow = '';

  if (transform && activeId === id) {
    boxShadow = '0px 6px 5px rgba(0, 0, 0, 0.24), 0px 9px 18px rgba(0, 0, 0, 0.18)';
  }

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, ...(transform && activeId === id ? { scaleY: 1.1, scaleX: 1.05 } : {}) } : null),
    transition,
    boxShadow,
  };

  const deleteHandler = async () => {
    setIsSubmit(true);
    await dispatch(deleteItemImage(id));
    setImages((state) => state.filter((value) => value.id !== id));
    setFileList((state) => state.filter((value) => value.response?.image.id !== id));
    setIsSubmit(false);
  };

  const DeleteButton = (
    <button className="icon-button p-2" style={{ backgroundColor: '#f7f9fc', borderRadius: '50%' }} onClick={deleteHandler} title={t('delete')}>
      <DeleteOutlined className="fs-5 hovered" />
      <span className="visually-hidden">{t('delete')}</span>
    </button>
  );

  return (
    <Badge count={DeleteButton} offset={[0, 90]}>
      <Badge count={index} color="blue">
        {image.src.endsWith('.mp4') ? (
          <video
            src={image.src}
            ref={setNodeRef}
            style={{ ...style, width: 100, height: 100 }}
            {...attributes} {...listeners}
          />
        ) : <Image src={src} width={100} height={100} alt={name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" ref={setNodeRef} style={style} {...attributes} {...listeners} />}
      </Badge>
    </Badge>
  );
};
