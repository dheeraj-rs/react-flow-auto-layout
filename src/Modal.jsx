// Modal.js
import React from 'react';

const Modal = ({ isOpen, onClose, onAddNode }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        zIndex: 1000,
      }}
    >
      <h2>Add New Node</h2>
      <button
        onClick={() => {
          onAddNode();
          onClose();
        }}
        style={{ marginRight: '10px' }}
      >
        Add Node
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
};

export default Modal;
