import { useState } from 'react';

// Modal component for adding new nodes
export const Modal = ({ isOpen, onClose, onConfirm, position }) => {
  const [handleCount, setHandleCount] = useState(1);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '5px',
        boxShadow: '0 0 10px rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      <h2>Add New Node</h2>
      <div>
        <label>
          Number of source handles:
          <input
            type="number"
            min="1"
            max="26"
            value={handleCount}
            onChange={(e) =>
              setHandleCount(
                Math.min(26, Math.max(1, parseInt(e.target.value) || 1))
              )
            }
          />
        </label>
      </div>
      <button onClick={() => onConfirm(handleCount)}>Create</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};
