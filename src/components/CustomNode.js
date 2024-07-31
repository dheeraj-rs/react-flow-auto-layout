import React, { useCallback } from 'react';
import { Handle, Position } from 'reactflow';

export const CustomNode = ({ id, data }) => {
  const nodeHeight = Math.max(60, data.sourceHandles.length * 40);
  const nodePadding = 10;
  const handleSize = 24;

  const handleShowModal = useCallback(
    (handleId, event) => {
      event.preventDefault();
      const rect = event.target.getBoundingClientRect();
      const position = { x: rect.left, y: rect.top };

      // Dispatch a custom event instead of calling showModal directly
      window.dispatchEvent(
        new CustomEvent('showModal', {
          detail: { sourceNodeId: id, handleId, position },
        })
      );
    },
    [id]
  );

  return (
    <div
      style={{
        backgroundColor: '#0f172a',
        color: '#fff',
        padding: nodePadding,
        borderRadius: 5,
        position: 'relative',
        width: '150px',
        height: `${nodeHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <div style={{ marginBottom: '10px' }}>{data.label}</div>
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: '#555', left: '-8px' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        {data.sourceHandles.map((handleId) => (
          <div
            key={handleId}
            style={{
              width: handleSize,
              height: handleSize,
              borderRadius: '50%',
              backgroundColor: '#555',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              margin: '4px 0',
              position: 'relative',
            }}
            onMouseDown={(event) => handleShowModal(handleId, event)}
          >
            <div
              style={{
                fontSize: '18px',
                color: '#fff',
                lineHeight: `${handleSize}px`,
              }}
            >
              +
            </div>
            <Handle
              type="source"
              position={Position.Right}
              id={handleId}
              style={{
                opacity: 0,
                width: '100%',
                height: '100%',
                background: 'transparent',
                border: 'none',
                right: '-8px',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
