import React from 'react';
import {
  DragDropContext,
  Droppable as RawDroppable,
  Draggable as RawDraggable
} from 'react-beautiful-dnd';

const droppableDefaults = RawDroppable?.defaultProps
  ? { ...RawDroppable.defaultProps }
  : {};
const draggableDefaults = RawDraggable?.defaultProps
  ? { ...RawDraggable.defaultProps }
  : {};

if (RawDroppable && Object.prototype.hasOwnProperty.call(RawDroppable, 'defaultProps')) {
  delete RawDroppable.defaultProps;
}

if (RawDraggable && Object.prototype.hasOwnProperty.call(RawDraggable, 'defaultProps')) {
  delete RawDraggable.defaultProps;
}

const Droppable = (props) => {
  const mergedProps = { ...droppableDefaults, ...props };
  return <RawDroppable {...mergedProps} />;
};

Droppable.displayName = RawDroppable?.displayName ?? 'Droppable';

const Draggable = (props) => {
  const mergedProps = { ...draggableDefaults, ...props };
  return <RawDraggable {...mergedProps} />;
};

Draggable.displayName = RawDraggable?.displayName ?? 'Draggable';

export { DragDropContext, Droppable, Draggable };
