import { useState, useRef, useCallback } from 'react';
import { CATEGORIES, CATEGORY_MAP, SLOT_HEIGHT, NUM_SLOTS } from '../utils/constants';
import { slotToLabel, findGaps, generateId } from '../utils/helpers';
import './Timeline.css';

const LABEL_WIDTH = 48;
const BLOCK_LEFT = 52;
const BLOCK_RIGHT_PAD = 8;

function clampSlot(slot) {
  return Math.max(0, Math.min(NUM_SLOTS - 1, slot));
}

function yToSlot(y) {
  return clampSlot(Math.floor(y / SLOT_HEIGHT));
}

function fitInGap(startSlot, endSlot, blocks) {
  const occupied = new Set();
  blocks.forEach(b => {
    for (let s = Math.max(b.startSlot, startSlot); s < Math.min(b.endSlot, endSlot); s++) {
      occupied.add(s);
    }
  });

  let best = null;
  let run = null;

  for (let s = startSlot; s < endSlot; s++) {
    if (!occupied.has(s)) {
      if (!run) run = { startSlot: s, endSlot: s + 1 };
      else run.endSlot = s + 1;
    } else {
      if (run) {
        if (!best || run.endSlot - run.startSlot > best.endSlot - best.startSlot) best = run;
        run = null;
      }
    }
  }
  if (run) {
    if (!best || run.endSlot - run.startSlot > best.endSlot - best.startSlot) best = run;
  }

  if (!best || best.endSlot - best.startSlot < 1) return null;
  return best;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TimeLabel({ slot }) {
  const top = slot * SLOT_HEIGHT;
  return (
    <div className="timeline-label" style={{ top, transform: 'translateY(-100%)' }}>
      {slotToLabel(slot)}
    </div>
  );
}

function SlotLine({ slot }) {
  const isHour = slot % 12 === 0;
  return (
    <div
      className={`timeline-slot-line${isHour ? ' hour' : ''}`}
      style={{ top: slot * SLOT_HEIGHT }}
    />
  );
}

function GapStrip({ gap }) {
  const [hovered, setHovered] = useState(false);
  const top = gap.startSlot * SLOT_HEIGHT;
  const height = (gap.endSlot - gap.startSlot) * SLOT_HEIGHT;

  return (
    <div
      className="timeline-gap"
      style={{ top, height, left: BLOCK_LEFT, right: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <div className="timeline-gap-tooltip">
          Looks like you haven&apos;t logged this time — add a block?
        </div>
      )}
    </div>
  );
}

function Block({ block, displayStartSlot, displayEndSlot, onClick, onResizeStart, onResizeDrag, onResizeEnd }) {
  const cat = CATEGORY_MAP[block.activity] || { color: '#e5e7eb', text: '#374151' };
  const startSlot = displayStartSlot ?? block.startSlot;
  const endSlot = displayEndSlot ?? block.endSlot;
  const top = startSlot * SLOT_HEIGHT;
  const height = (endSlot - startSlot) * SLOT_HEIGHT - 2;

  const makeResizeHandlers = (edge) => ({
    onPointerDown(e) {
      e.stopPropagation();
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      onResizeStart(block.id, edge);
    },
    onPointerMove(e) {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      onResizeDrag(block.id, edge, e.clientY);
    },
    onPointerUp(e) {
      if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      onResizeEnd(block.id, edge, e.clientY);
    },
    onClick(e) {
      e.stopPropagation();
    },
  });

  return (
    <div
      className="timeline-block"
      style={{
        top,
        height,
        left: BLOCK_LEFT,
        right: BLOCK_RIGHT_PAD,
        backgroundColor: cat.color,
        color: cat.text,
      }}
      onPointerDown={e => e.stopPropagation()}
      onClick={e => { e.stopPropagation(); onClick(block); }}
    >
      <div className="timeline-block-resize-handle top" {...makeResizeHandlers('top')} />
      <span className="timeline-block-activity">{block.activity || 'Untitled'}</span>
      {block.note && <span className="timeline-block-note">{block.note}</span>}
      <div className="timeline-block-resize-handle bottom" {...makeResizeHandlers('bottom')} />
    </div>
  );
}

function DragPreview({ startSlot, endSlot }) {
  if (endSlot <= startSlot) return null;
  const top = startSlot * SLOT_HEIGHT;
  const height = (endSlot - startSlot) * SLOT_HEIGHT;
  return (
    <div
      className="timeline-drag-preview"
      style={{ top, height, left: BLOCK_LEFT, right: BLOCK_RIGHT_PAD }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function Timeline({ blocks, onBlocksChange, onBlockClick }) {
  const wrapperRef = useRef(null);

  // New-block drag state
  const dragRef = useRef(null);
  const [drag, setDrag] = useState(null);

  // Resize state
  const resizeRef = useRef(null); // { blockId, edge, origStartSlot, origEndSlot }
  const [resizeSlots, setResizeSlots] = useState(null); // { blockId, startSlot, endSlot }

  // ------------------------------------------------------------------
  // Shared util
  // ------------------------------------------------------------------

  const getRelativeY = useCallback(e => {
    const rect = wrapperRef.current.getBoundingClientRect();
    return e.clientY - rect.top;
  }, []);

  const clientYToSlot = useCallback(clientY => {
    const rect = wrapperRef.current.getBoundingClientRect();
    return clampSlot(Math.floor((clientY - rect.top) / SLOT_HEIGHT));
  }, []);

  // ------------------------------------------------------------------
  // New-block drag handlers (fire only on wrapper, not on blocks)
  // ------------------------------------------------------------------

  const handlePointerDown = useCallback(e => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const slot = yToSlot(getRelativeY(e));
    dragRef.current = { startSlot: slot };
    setDrag({ startSlot: slot, endSlot: slot + 1 });

    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [getRelativeY]);

  const handlePointerMove = useCallback(e => {
    if (!dragRef.current) return;

    const slot = yToSlot(getRelativeY(e));
    const { startSlot } = dragRef.current;
    const lo = Math.min(startSlot, slot);
    const hi = Math.max(startSlot, slot) + 1;
    setDrag({ startSlot: lo, endSlot: Math.min(hi, NUM_SLOTS) });
  }, [getRelativeY]);

  const handlePointerUp = useCallback(e => {
    if (!dragRef.current) return;

    const { startSlot: dragStart } = dragRef.current;
    dragRef.current = null;
    setDrag(null);

    const slot = yToSlot(getRelativeY(e));
    const lo = Math.min(dragStart, slot);
    const hi = Math.max(dragStart, slot) + 1;
    const proposed = { startSlot: lo, endSlot: Math.min(hi, NUM_SLOTS) };

    const hasOverlap = blocks.some(
      b => b.startSlot < proposed.endSlot && proposed.startSlot < b.endSlot
    );

    let finalRange = proposed;
    if (hasOverlap) {
      const fitted = fitInGap(proposed.startSlot, proposed.endSlot, blocks);
      if (!fitted) return;
      finalRange = fitted;
    }

    if (finalRange.endSlot - finalRange.startSlot < 1) return;

    const newBlock = {
      id: generateId(),
      startSlot: finalRange.startSlot,
      endSlot: finalRange.endSlot,
      activity: '',
      note: '',
    };

    onBlockClick(newBlock);
  }, [blocks, getRelativeY, onBlockClick]);

  const handlePointerCancel = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
  }, []);

  // ------------------------------------------------------------------
  // Resize handlers
  // ------------------------------------------------------------------

  const handleResizeStart = useCallback((blockId, edge) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    resizeRef.current = { blockId, edge, origStartSlot: block.startSlot, origEndSlot: block.endSlot };
    setResizeSlots({ blockId, startSlot: block.startSlot, endSlot: block.endSlot });
  }, [blocks]);

  const handleResizeDrag = useCallback((blockId, edge, clientY) => {
    if (!resizeRef.current || resizeRef.current.blockId !== blockId) return;
    const slot = clientYToSlot(clientY);
    setResizeSlots(prev => {
      if (!prev || prev.blockId !== blockId) return prev;
      if (edge === 'top') {
        return { ...prev, startSlot: Math.max(0, Math.min(slot, prev.endSlot - 1)) };
      } else {
        return { ...prev, endSlot: Math.min(NUM_SLOTS, Math.max(slot + 1, prev.startSlot + 1)) };
      }
    });
  }, [clientYToSlot]);

  const handleResizeEnd = useCallback((blockId, edge, clientY) => {
    if (!resizeRef.current || resizeRef.current.blockId !== blockId) return;
    const { origStartSlot, origEndSlot } = resizeRef.current;
    resizeRef.current = null;
    setResizeSlots(null);

    const slot = clientYToSlot(clientY);
    let newStart = origStartSlot;
    let newEnd = origEndSlot;

    if (edge === 'top') {
      newStart = Math.max(0, Math.min(slot, origEndSlot - 1));
    } else {
      newEnd = Math.min(NUM_SLOTS, Math.max(slot + 1, origStartSlot + 1));
    }

    onBlocksChange(prev => {
      const others = prev.filter(b => b.id !== blockId);
      const hasOverlap = others.some(b => b.startSlot < newEnd && newStart < b.endSlot);
      if (hasOverlap) return prev;
      return prev.map(b => b.id === blockId ? { ...b, startSlot: newStart, endSlot: newEnd } : b);
    });
  }, [clientYToSlot, onBlocksChange]);

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  const gaps = findGaps(blocks);

  // Hour labels every 12 slots; include final boundary label
  const labelSlots = [];
  for (let s = 0; s <= NUM_SLOTS; s += 12) {
    labelSlots.push(s);
  }

  // Grid lines at every 30-min boundary (every 6 slots)
  const slotLines = [];
  for (let s = 0; s <= NUM_SLOTS; s += 6) {
    slotLines.push(s);
  }

  const totalHeight = NUM_SLOTS * SLOT_HEIGHT;

  return (
    <div
      ref={wrapperRef}
      className="timeline-wrapper"
      style={{ height: totalHeight }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {slotLines.map(s => (
        <SlotLine key={s} slot={s} />
      ))}

      {labelSlots.map(s => (
        <TimeLabel key={s} slot={s} />
      ))}

      {gaps.map((gap, i) => (
        <GapStrip key={i} gap={gap} />
      ))}

      {blocks.map(block => {
        const isResizing = resizeSlots?.blockId === block.id;
        return (
          <Block
            key={block.id}
            block={block}
            displayStartSlot={isResizing ? resizeSlots.startSlot : undefined}
            displayEndSlot={isResizing ? resizeSlots.endSlot : undefined}
            onClick={onBlockClick}
            onResizeStart={handleResizeStart}
            onResizeDrag={handleResizeDrag}
            onResizeEnd={handleResizeEnd}
          />
        );
      })}

      {drag && drag.endSlot > drag.startSlot && (
        <DragPreview startSlot={drag.startSlot} endSlot={drag.endSlot} />
      )}
    </div>
  );
}
