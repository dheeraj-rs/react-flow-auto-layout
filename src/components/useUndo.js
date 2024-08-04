import { useState } from 'react';

export function useUndo(initialState) {
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  function pushState(newState) {
    setPast((prev) => [...prev, newState]);
    setFuture([]);
  }

  function undo() {
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [...prev, previous]);
    return previous;
  }

  function redo() {
    if (future.length === 0) return null;
    const next = future[future.length - 1];
    setFuture((prev) => prev.slice(0, -1));
    setPast((prev) => [...prev, next]);
    return next;
  }

  return { undo, redo, pushState };
}
