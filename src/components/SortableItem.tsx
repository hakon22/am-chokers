import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { Badge } from 'antd';

import { ImageEntity } from '@server/db/entities/image.entity';

const SortableItem = ({ image, index, activeId }: { image: ImageEntity, index: number, activeId: number }) => {
  const { id, path, name } = image;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  let boxShadow = '';

  if (transform && activeId === id) {
    transform.scaleY = 1.1;
    transform.scaleX = 1.05;
    boxShadow = '0px 6px 5px rgba(0, 0, 0, 0.24), 0px 9px 18px rgba(0, 0, 0, 0.18)';
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow,
  };

  return (
    <Badge count={index} color="blue">
      <Image src={`${path}/${name}`} width={100} height={100} unoptimized alt={name} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" ref={setNodeRef} style={style} {...attributes} {...listeners} />
    </Badge>
  );
};

export default SortableItem;
