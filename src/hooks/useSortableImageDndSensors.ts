import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

/**
 * Sortable image grids: default PointerSensor-only DnD often fails on touch
 * (scroll wins or drag never starts). TouchSensor registers the non-passive
 * touch listeners dnd-kit expects on mobile; activation constraints separate
 * drag from scroll.
 */
export const useSortableImageDndSensors = () => {
  return useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
};
