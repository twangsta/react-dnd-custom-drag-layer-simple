import React, { useState, useCallback, useEffect } from "react";
import ReactDOM from "react-dom";
import { DndProvider, useDrag, DragSourceMonitor } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { useDrop } from "react-dnd";
import update from "immutability-helper";
import { XYCoord, useDragLayer } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import "./main.css";

interface DragItem {
  id: string;
  type: string;
  left: number;
  top: number;
}

interface BoxMap {
  [key: string]: { top: number; left: number; title: string };
}

interface DraggableBoxProps {
  id: string;
  showEmptyPlaceholder: boolean;
  item: {
    title: string;
    left: number;
    top: number;
  };
}

export const ItemTypes = { BOX: "box" };

function getDraggableBoxStyles(
  left: number,
  top: number,
  isDragging: boolean
): React.CSSProperties {
  const transform = `translate3d(${left}px, ${top}px, 0)`;
  return {
    position: "absolute",
    transform,
    WebkitTransform: transform,
    // IE fallback: hide the real node using CSS when dragging
    // because IE will ignore our custom "empty image" drag preview.
    opacity: isDragging ? 0 : 1,
    height: isDragging ? 0 : ""
  };
}

function DraggableBox({ id, showEmptyPlaceholder, item }: DraggableBoxProps) {
  const { title, left, top } = item;
  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: ItemTypes.BOX, id, left, top, title },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  useEffect(() => {
    if (showEmptyPlaceholder) {
      preview(getEmptyImage(), { captureDraggingState: true });
    }
  }, [showEmptyPlaceholder, preview]);

  return (
    <div
      ref={drag}
      className="dragitem"
      style={getDraggableBoxStyles(left, top, isDragging)}
    >
      {title}
    </div>
  );
}

function getDragLayerStyles(
  initialOffset: XYCoord | null,
  currentOffset: XYCoord | null
) {
  if (!initialOffset || !currentOffset) {
    return {
      display: "none"
    };
  }

  let { x, y } = currentOffset;

  const transform = `translate(${x}px, ${y}px)`;
  return {
    transform,
    WebkitTransform: transform
  };
}

function CustomDragLayer() {
  const {
    itemType,
    isDragging,
    item,
    initialOffset,
    currentOffset
  } = useDragLayer(monitor => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    initialOffset: monitor.getInitialSourceClientOffset(),
    currentOffset: monitor.getSourceClientOffset(),
    isDragging: monitor.isDragging()
  }));

  const renderItem = () => {
    switch (itemType) {
      case ItemTypes.BOX:
        return (
          <div className="dragitem" style={{ backgroundColor: "green" }}>
            {item.title}
          </div>
        );
      default:
        return null;
    }
  };

  if (!isDragging) {
    return null;
  }

  return (
    <div className="draglayer">
      <div style={getDragLayerStyles(initialOffset, currentOffset)}>
        {renderItem()}
      </div>
    </div>
  );
}

function Container() {
  const [boxes, setBoxes] = useState<BoxMap>({
    a: { top: 20, left: 80, title: "Drag me around" },
    b: { top: 180, left: 20, title: "Drag me too" }
  });
  const [showEmptyPlaceholder, setShowEmptyPlaceholder] = useState(false);

  const moveBox = useCallback(
    (id: string, left: number, top: number) => {
      setBoxes(update(boxes, { [id]: { $merge: { left, top } } }));
    },
    [boxes]
  );

  const [, drop] = useDrop({
    accept: ItemTypes.BOX,
    drop(item: DragItem, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset() as {
        x: number;
        y: number;
      };

      let left = Math.round(item.left + delta.x);
      let top = Math.round(item.top + delta.y);

      moveBox(item.id, left, top);
      return undefined;
    }
  });

  return (
    <>
      <div ref={drop} className="dragcontainer">
        {Object.keys(boxes).map(key => (
          <DraggableBox
            key={key}
            id={key}
            item={boxes[key]}
            showEmptyPlaceholder={showEmptyPlaceholder}
          />
        ))}
      </div>

      <input
        id="placeholder"
        type="checkbox"
        checked={showEmptyPlaceholder}
        onChange={() => setShowEmptyPlaceholder(!showEmptyPlaceholder)}
      />
      <label htmlFor="placeholder">Show empty placeholder during drag</label>
    </>
  );
}

function App() {
  return (
    <div>
      <DndProvider backend={Backend}>
        <Container />
        <CustomDragLayer />
      </DndProvider>
    </div>
  );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
