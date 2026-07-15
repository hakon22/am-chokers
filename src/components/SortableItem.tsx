import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { useSortable } from '@dnd-kit/sortable';
import { DeleteOutlined } from '@ant-design/icons';
import { CSS } from '@dnd-kit/utilities';
import { Badge, Checkbox } from 'antd';
import { useContext } from 'react';
import type { UploadFile } from 'antd/lib';

import { SubmitContext } from '@/components/Context';
import { useAppDispatch } from '@/hooks/reduxHooks';
import { deleteItemImage } from '@/slices/appSlice';
import type { ImageEntity } from '@server/db/entities/image.entity';
import type { ResponseFileInterface } from '@/types/storage/ResponseFileInterface';

type SortableItemProps = {
  image: ImageEntity;
  index: number;
  activeId: number;
  setImages: React.Dispatch<React.SetStateAction<ImageEntity[]>>;
  setFileList: React.Dispatch<React.SetStateAction<UploadFile<ResponseFileInterface>[]>>;
  onTryOnChange: (imageId: number, tryOn: boolean) => void;
  /** Показывать галочку и бейдж «Для примерки» (только для групп с AI-примеркой) */
  showTryOnControls: boolean;
};

/**
 * Элемент сортируемой сетки фото товара в админке
 * @param props - изображение, индекс, колбэки DnD и флаг try-on UI
 * @returns миниатюра с удалением, опционально галочка примерки
 */
export const SortableItem = ({
  image,
  index,
  activeId,
  setImages,
  setFileList,
  onTryOnChange,
  showTryOnControls,
}: SortableItemProps) => {
  const { t } = useTranslation('translation', { keyPrefix: 'modules.sortableItem' });
  const dispatch = useAppDispatch();

  const { setIsSubmit } = useContext(SubmitContext);

  const { id, src, name, tryOn } = image;
  const isRasterImage = !src.endsWith('.mp4');
  const isTryOnLocked = showTryOnControls && tryOn;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id, disabled: isTryOnLocked });

  let boxShadow = '';

  if (transform && activeId === id) {
    boxShadow = '0px 6px 5px rgba(0, 0, 0, 0.24), 0px 9px 18px rgba(0, 0, 0, 0.18)';
  }

  const style = {
    transform: CSS.Transform.toString(transform ? { ...transform, ...(transform && activeId === id ? { scaleY: 1.1, scaleX: 1.05 } : {}) } : null),
    transition,
    boxShadow,
  };

  /**
   * Удаляет изображение товара с сервера и из локального состояния формы
   */
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

  const thumb = { width: 100, height: 100 } as const;

  return (
    <div className="d-flex flex-column align-items-center gap-1">
      <Badge count={DeleteButton} offset={[0, 90]}>
        <Badge count={index} color="blue">
          <div
            ref={setNodeRef}
            style={{
              ...style,
              ...thumb,
              touchAction: isTryOnLocked ? 'auto' : 'none',
              position: 'relative',
            }}
            {...attributes}
            {...(isTryOnLocked ? {} : listeners)}
          >
            {isTryOnLocked ? (
              <span
                className="position-absolute top-0 start-0 m-1 px-1 py-0 rounded text-white"
                style={{ backgroundColor: 'rgba(59, 83, 130, 0.92)', fontSize: 10, zIndex: 1, lineHeight: 1.4 }}
              >
                {t('tryOnBadge')}
              </span>
            ) : null}
            {src.endsWith('.mp4') ? (
              <video
                src={src}
                style={{ ...thumb, display: 'block', pointerEvents: 'none' }}
              />
            ) : (
              <Image
                src={src}
                width={100}
                height={100}
                unoptimized
                alt={name}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ display: 'block', pointerEvents: 'none' }}
              />
            )}
          </div>
        </Badge>
      </Badge>
      {showTryOnControls && isRasterImage ? (
        <Checkbox
          checked={tryOn}
          onChange={(event) => onTryOnChange(id, event.target.checked)}
        >
          {t('tryOnLabel')}
        </Checkbox>
      ) : null}
    </div>
  );
};
